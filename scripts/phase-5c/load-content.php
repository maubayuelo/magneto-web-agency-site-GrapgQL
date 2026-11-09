<?php
/**
 * Phase 5c loader — LOCAL EN / FR / ES content for Services, Packages, About, Contact, page heroes and two case studies.
 * LOCAL ONLY. Run by Mauricio, never by agents.
 *
 * Spec: docs/specs/phase-5c-loader.md rev 3.1 (§3), which folds in the 5b §5.4 override: cta_text_hero is the main CTA
 * label per language; cta_link_hero is never written. Values come only from scripts/phase-5c/content/<lang>.json.
 *
 * Run from Local's "Open site shell" (one command at a time, one language per run, order en → fr → es):
 *   wp eval-file <repo>/scripts/phase-5c/load-content.php lang=<en|fr|es> dry-run
 *   wp eval-file <repo>/scripts/phase-5c/load-content.php lang=<en|fr|es> backup=<.sql file exported in the last 3 hours>
 * Optional: content=<path to a content JSON> (default: content/<lang>.json next to this file; used for guard proofs).
 *
 * Order: guards → preflight (nothing written if any check fails) → plan (dry-run prints it and stops) → write →
 * read-back by key and by meta name → cross-language probe. No deletes, no post/title/slug/status changes, no options,
 * no WPML writes. Rows are merged by index; missing rows are appended only under the D-1 B rule (ADR 0006 am. 3).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( "Run with: wp eval-file scripts/phase-5c/load-content.php lang=en dry-run\n" );
}

$p5c_args    = (array) ( $args ?? array() );
$p5c_dry_run = in_array( 'dry-run', $p5c_args, true );
$p5c_opt     = static function ( $name ) use ( $p5c_args ) {
	foreach ( $p5c_args as $arg ) {
		if ( 0 === strpos( (string) $arg, $name . '=' ) ) {
			return substr( (string) $arg, strlen( $name ) + 1 );
		}
	}
	return null;
};
$p5c_abort = static function ( $message ) {
	WP_CLI::error( 'Aborted before any write: ' . $message );
};

// ---- 1. Local-only guard (no flag overrides it) ---------------------------------------------------------------------
$p5c_expected_home = 'http://magneto-cms-2.local';
if ( untrailingslashit( home_url() ) !== $p5c_expected_home ) {
	$p5c_abort( 'home_url() is ' . home_url() . ", expected {$p5c_expected_home}. This loader is local only." );
}

// ---- 2. Language argument (§3.1) -----------------------------------------------------------------------------------
$p5c_sources = array(
	'en' => 'docs/content/magneto-copy-en.md',
	'fr' => 'docs/content/magneto-copy-fr-CA.md',
	'es' => 'docs/content/magneto-copy-es.md',
);
$p5c_lang = (string) $p5c_opt( 'lang' );
if ( ! isset( $p5c_sources[ $p5c_lang ] ) ) {
	$p5c_abort( 'lang=en|fr|es is required (one language per run).' );
}
$p5c_others = array_values( array_diff( array_keys( $p5c_sources ), array( $p5c_lang ) ) );

// ---- 3. Backup guard (real run only) ---------------------------------------------------------------------------------
if ( ! $p5c_dry_run ) {
	$p5c_backup = $p5c_opt( 'backup' );
	if ( null === $p5c_backup || '' === $p5c_backup ) {
		$p5c_abort( 'a real run needs backup=<path to the .sql exported in the last 3 hours> (or pass dry-run).' );
	}
	if ( '.sql' !== substr( $p5c_backup, -4 ) || ! is_file( $p5c_backup ) ) {
		$p5c_abort( "backup file not found or not a .sql file: {$p5c_backup}" );
	}
	$p5c_age = time() - (int) filemtime( $p5c_backup );
	if ( $p5c_age > 3 * HOUR_IN_SECONDS ) {
		$p5c_abort( 'backup is older than 3 hours (' . round( $p5c_age / 3600, 1 ) . " h): {$p5c_backup}" );
	}
	WP_CLI::log( "Backup: {$p5c_backup} (" . filesize( $p5c_backup ) . ' bytes, ' . round( $p5c_age / 60 ) . ' min old)' );
}

// ---- 4. Preflight: content file, pin, language -----------------------------------------------------------------------
if ( ! function_exists( 'update_field' ) || ! function_exists( 'acf_get_field' ) ) {
	$p5c_abort( 'ACF is not active.' );
}
$p5c_repo         = dirname( __DIR__, 2 );
$p5c_content_path = $p5c_opt( 'content' ) ?: __DIR__ . "/content/{$p5c_lang}.json";
$p5c_content      = json_decode( (string) file_get_contents( $p5c_content_path ), true );
if ( ! is_array( $p5c_content ) || empty( $p5c_content['posts'] ) || empty( $p5c_content['source']['file'] ) ) {
	$p5c_abort( "content file missing or invalid: {$p5c_content_path}" );
}
if ( $p5c_content['source']['file'] !== $p5c_sources[ $p5c_lang ] ) {
	$p5c_abort( "lang={$p5c_lang} but source.file is {$p5c_content['source']['file']} (expected {$p5c_sources[ $p5c_lang ]})." );
}
$p5c_source = $p5c_repo . '/' . $p5c_content['source']['file'];
if ( ! is_file( $p5c_source ) || hash_file( 'sha256', $p5c_source ) !== $p5c_content['source']['sha256'] ) {
	$p5c_abort( "source.sha256 does not match {$p5c_content['source']['file']} (content: {$p5c_content_path})." );
}
WP_CLI::log( "Content: {$p5c_content_path} · lang {$p5c_lang} · source {$p5c_content['source']['file']} sha256 " . substr( $p5c_content['source']['sha256'], 0, 12 ) . '… ok' );

// Entries with the same type + slug + lang are merged into one post plan in file order (EN only; a key set twice aborts).
$p5c_posts = array();
foreach ( $p5c_content['posts'] as $p5c_entry ) {
	if ( $p5c_lang !== ( $p5c_entry['lang'] ?? '' ) ) {
		$p5c_abort( "lang={$p5c_lang} but {$p5c_entry['type']}/{$p5c_entry['slug']} has lang " . ( $p5c_entry['lang'] ?? '(none)' ) . '.' );
	}
	$p5c_pk = "{$p5c_entry['type']}/{$p5c_entry['slug']}";
	if ( isset( $p5c_posts[ $p5c_pk ] ) ) {
		if ( 'en' !== $p5c_lang ) {
			$p5c_abort( "{$p5c_pk}/{$p5c_lang} appears twice; duplicate entries are allowed only in en.json." );
		}
		$p5c_set = array_column( $p5c_posts[ $p5c_pk ]['fields'], 'key' );
		foreach ( $p5c_entry['fields'] as $p5c_field ) {
			if ( in_array( $p5c_field['key'], $p5c_set, true ) ) {
				$p5c_abort( "{$p5c_pk}/en: {$p5c_field['key']} ({$p5c_field['label']}) is set by two entries." );
			}
		}
		$p5c_posts[ $p5c_pk ]['fields'] = array_merge( $p5c_posts[ $p5c_pk ]['fields'], $p5c_entry['fields'] );
	} else {
		$p5c_posts[ $p5c_pk ] = $p5c_entry;
	}
}

// ---- 5. Preflight: field definitions ------------------------------------------------------------------------------------
$p5c_forbidden_types = array( 'image', 'gallery', 'file', 'url', 'true_false' );
$p5c_def             = static function ( $key ) use ( $p5c_abort ) {
	$def = acf_get_field( $key );
	if ( ! $def ) {
		$p5c_abort( "field {$key} not found — is phase-5-field-groups.json imported?" );
	}
	return $def;
};
$p5c_has_image_sub = static function ( $key ) use ( $p5c_def ) {
	foreach ( (array) acf_get_fields( $p5c_def( $key ) ) as $sub ) {
		if ( in_array( $sub['type'] ?? '', array( 'image', 'gallery', 'file' ), true ) ) {
			return true;
		}
	}
	return false;
};
// Copy-pref values the frontend needs per language (§3.5): copied from the EN value, never from the content file.
$p5c_copy_sync_sub   = 'field_p5_servicesservicedetails_services_service_group';
$p5c_copy_sync_field = 'field_p5_projectsprojectdata_display_order';
foreach ( $p5c_posts as $p5c_post ) {
	foreach ( $p5c_post['fields'] as $p5c_field ) {
		$p5c_keys = array_merge( array( $p5c_field['key'] ), array_keys( (array) ( $p5c_field['subfields'] ?? array() ) ) );
		foreach ( $p5c_keys as $p5c_k ) {
			$p5c_type = $p5c_def( $p5c_k )['type'] ?? '';
			if ( in_array( $p5c_type, $p5c_forbidden_types, true ) || in_array( $p5c_k, array( 'field_689a2e2960322', $p5c_copy_sync_field ), true ) ) {
				$p5c_abort( "{$p5c_field['label']}: key {$p5c_k} ({$p5c_type}) may not be in a content file." );
			}
		}
	}
}

// ---- 6. Preflight: target posts --------------------------------------------------------------------------------------
$p5c_lang_of = static function ( $id ) {
	$details = apply_filters( 'wpml_post_language_details', null, $id );
	return is_array( $details ) ? ( $details['language_code'] ?? '' ) : '';
};
$p5c_en_id = static function ( $type, $slug ) use ( $p5c_lang_of, $p5c_abort ) {
	$found = get_posts(
		array(
			'post_type'        => $type,
			'name'             => $slug,
			'post_status'      => array( 'publish', 'draft', 'pending', 'private', 'future' ),
			'numberposts'      => -1,
			'fields'           => 'ids',
			'suppress_filters' => true, // all languages; filtered below
		)
	);
	$en = array_values( array_filter( $found, static function ( $id ) use ( $p5c_lang_of ) { return 'en' === $p5c_lang_of( $id ); } ) );
	if ( 1 !== count( $en ) ) {
		$p5c_abort( "{$type} '{$slug}' resolves to " . count( $en ) . ' EN posts (expected exactly 1).' );
	}
	return (int) $en[0];
};
// Translation-post checklist rows (spec §5); FR/ES home and FR projects existed before the checklist.
$p5c_checklist = array(
	'page/services/fr' => 1, 'page/packages/fr' => 2, 'page/about-magneto/fr' => 3, 'page/contact/fr' => 4,
	'page/services/es' => 5, 'page/packages/es' => 6, 'page/about-magneto/es' => 7, 'page/contact/es' => 8,
	'page/projects/es' => 9,
	'project/fashion-company-ecommerce/fr' => 10, 'project/shamaniccas-ecommerce/fr' => 11,
	'project/fashion-company-ecommerce/es' => 12, 'project/shamaniccas-ecommerce/es' => 13,
);
$p5c_translation = static function ( $en_id, $type, $lang ) {
	$tid = apply_filters( 'wpml_object_id', $en_id, $type, false, $lang );
	return ( $tid && (int) $tid !== (int) $en_id ) ? (int) $tid : 0;
};
$p5c_ids    = array(); // post key → [ en id, target id ]
foreach ( $p5c_posts as $p5c_pk => $p5c_post ) {
	$p5c_en = $p5c_en_id( $p5c_post['type'], $p5c_post['slug'] );
	if ( 'en' === $p5c_lang ) {
		$p5c_ids[ $p5c_pk ] = array( $p5c_en, $p5c_en );
		continue;
	}
	$p5c_row = isset( $p5c_checklist[ "{$p5c_pk}/{$p5c_lang}" ] ) ? 'checklist row #' . $p5c_checklist[ "{$p5c_pk}/{$p5c_lang}" ] : 'existing translation (not a checklist row)';
	$p5c_tid = $p5c_translation( $p5c_en, $p5c_post['type'], $p5c_lang );
	if ( ! $p5c_tid ) {
		$p5c_abort( "{$p5c_pk}/{$p5c_lang} ({$p5c_row}): no {$p5c_lang} translation of EN {$p5c_en}." );
	}
	$p5c_t = get_post( $p5c_tid );
	if ( $p5c_lang !== $p5c_lang_of( $p5c_tid ) ) {
		$p5c_abort( "{$p5c_pk}/{$p5c_lang} ({$p5c_row}): post {$p5c_tid} has WPML language '" . $p5c_lang_of( $p5c_tid ) . "'." );
	}
	if ( ! $p5c_t || $p5c_t->post_name !== $p5c_post['slug'] ) {
		$p5c_abort( "{$p5c_pk}/{$p5c_lang} ({$p5c_row}): post {$p5c_tid} slug is '" . ( $p5c_t->post_name ?? '' ) . "', expected the EN slug." );
	}
	if ( 'publish' !== $p5c_t->post_status ) {
		$p5c_abort( "{$p5c_pk}/{$p5c_lang} ({$p5c_row}): post {$p5c_tid} status is {$p5c_t->post_status}, expected publish." );
	}
	if ( '' !== (string) get_post_meta( $p5c_tid, '_icl_lang_duplicate_of', true ) ) {
		$p5c_abort( "{$p5c_pk}/{$p5c_lang} ({$p5c_row}): post {$p5c_tid} is still a WPML duplicate — click 'Translate independently'." );
	}
	$p5c_ids[ $p5c_pk ] = array( $p5c_en, $p5c_tid );
}

// ---- 7. Plan: row rule (D-1 B), merge by index, group merge, copy-sync -------------------------------------------------
// EN growth repeaters (D-2): allowed EN row counts before → after the parity run. Everything else is exact.
$p5c_en_growth = array(
	'page/packages'                     => array( 'sections' => array( 0, 2 ) ),
	'project/fashion-company-ecommerce' => array( 'project_data_results' => array( 3, 6 ) ),
	'project/shamaniccas-ecommerce'     => array( 'project_data_solutions' => array( 3, 4 ), 'project_data_results' => array( 3, 6 ) ),
);
$p5c_short = static function ( $value ) {
	$text = is_scalar( $value ) || null === $value ? (string) $value : wp_json_encode( $value, JSON_UNESCAPED_UNICODE );
	$text = str_replace( array( "\r", "\n" ), array( '', '⏎' ), $text );
	return '"' . ( mb_strlen( $text ) > 60 ? mb_substr( $text, 0, 57 ) . '…' : $text ) . '"';
};
$p5c_str = static function ( $value ) {
	return (string) ( is_array( $value ) ? wp_json_encode( $value ) : $value );
};
$p5c_rows = static function ( $raw ) {
	return is_array( $raw ) ? array_values( $raw ) : array();
};
$p5c_plan    = array(); // [ post key, target id, field key, tag, new value, old raw value ]
$p5c_changes = 0;
$p5c_same    = 0;
$p5c_appends = 0;
$p5c_totals  = array();
$p5c_media   = array(); // media report lines
$p5c_prefix  = $p5c_dry_run ? '[dry-run] ' : '';

/*
 * Compare + merge one scalar value. Returns the value to write.
 */
$p5c_scalar = static function ( $tag, $old, $new, &$diff, &$changed, &$unchanged ) use ( $p5c_short, $p5c_str ) {
	if ( $p5c_str( $old ?? '' ) === (string) $new ) {
		++$unchanged;
		WP_CLI::log( "  = unchanged  {$tag}" );
	} else {
		++$changed;
		++$diff;
		WP_CLI::log( "  ~ change     {$tag}: " . $p5c_short( $old ) . ' → ' . $p5c_short( $new ) );
	}
	return $new;
};

/*
 * Row rule + merge for one repeater (top level or nested in a group). $ctx carries the post, language and EN rows.
 */
$p5c_repeater = static function ( array $ctx, $rep_key, $meta_name, array $content_rows, $old_raw, $en_raw, array $names, &$diff, &$changed, &$unchanged, &$appended ) use ( $p5c_lang, $p5c_abort, $p5c_has_image_sub, $p5c_en_growth, $p5c_rows, $p5c_short, $p5c_str, $p5c_copy_sync_sub, &$p5c_media ) {
	$tag      = "{$ctx['slug']}/{$p5c_lang} {$meta_name}";
	$old_rows = $p5c_rows( $old_raw );
	$en_rows  = $p5c_rows( $en_raw );
	$have     = count( $old_rows );
	$want     = count( $content_rows );
	$en_n     = count( $en_rows );
	if ( 'en' === $p5c_lang ) {
		$allowed = $p5c_en_growth[ $ctx['pk'] ][ $meta_name ] ?? null;
		if ( null === $allowed ) {
			if ( $have !== $want ) {
				$p5c_abort( "{$tag}: content has {$want} rows, EN has {$have} (exact count required)." );
			}
		} elseif ( ! in_array( $have, $allowed, true ) || $want !== max( $allowed ) ) {
			$p5c_abort( "{$tag}: EN has {$have} rows, content {$want}; allowed EN " . implode( ' or ', $allowed ) . ' → ' . max( $allowed ) . '.' );
		}
	} else {
		if ( $want !== $en_n ) {
			$p5c_abort( "{$tag}: content has {$want} rows, EN has {$en_n} (content rows must equal EN rows; run lang=en first)." );
		}
		if ( $have > $en_n ) {
			$p5c_abort( "{$tag}: target has {$have} rows, more than EN ({$en_n}); rows are never removed." );
		}
	}
	if ( $have < $want && $p5c_has_image_sub( $rep_key ) ) {
		$p5c_abort( "{$tag}: would grow {$have} → {$want}, but the repeater has an image sub-field (amendment 3)." );
	}
	$merged = array();
	foreach ( $content_rows as $i => $row ) {
		if ( $i >= $have ) {
			// Appended row: only the content sub-keys; one line per row, not counted in changes.
			$parts = array();
			foreach ( $row as $sub => $value ) {
				$parts[] = ( $names[ $sub ] ?? $sub ) . '=' . $p5c_short( $value );
			}
			WP_CLI::log( "  + append {$ctx['slug']}/{$p5c_lang} {$meta_name}[{$i}] " . implode( ' ', $parts ) );
			++$appended;
			$merged[] = $row;
			continue;
		}
		$m = is_array( $old_rows[ $i ] ) ? $old_rows[ $i ] : array();
		foreach ( $row as $sub => $value ) {
			$name = $names[ $sub ] ?? $sub;
			if ( 'en' !== $p5c_lang && $p5c_copy_sync_sub === $sub ) {
				$en_value = $en_rows[ $i ][ $sub ] ?? '';
				if ( $p5c_str( $en_value ) !== (string) $value ) {
					$p5c_abort( "{$tag}[{$i}].{$name}: content " . $p5c_short( $value ) . ' ≠ EN ' . $p5c_short( $en_value ) . ' (copy-sync value).' );
				}
				$value = $en_value;
				WP_CLI::log( "  ↺ copy-sync  {$tag}[{$i}].{$name} from EN " . $p5c_short( $en_value ) );
			}
			$was = $m[ $sub ] ?? '';
			if ( $p5c_str( $was ) === $p5c_str( $value ) ) {
				++$unchanged;
				WP_CLI::log( "  = unchanged  {$tag}[{$i}].{$name}" );
			} else {
				++$changed;
				++$diff;
				WP_CLI::log( "  ~ change     {$tag}[{$i}].{$name}: " . $p5c_short( $was ) . ' → ' . $p5c_short( $value ) );
			}
			$m[ $sub ] = $value;
		}
		// Media report (read-only): image sub-fields compared by EN original attachment (§3.6).
		if ( 'en' !== $p5c_lang ) {
			foreach ( (array) acf_get_fields( acf_get_field( $rep_key ) ) as $sub_def ) {
				if ( 'image' !== ( $sub_def['type'] ?? '' ) ) {
					continue;
				}
				$t_att  = (int) ( $m[ $sub_def['key'] ] ?? 0 );
				$e_att  = (int) ( $en_rows[ $i ][ $sub_def['key'] ] ?? 0 );
				$t_orig = $t_att ? (int) apply_filters( 'wpml_object_id', $t_att, 'attachment', true, 'en' ) : 0;
				$p5c_media[] = ( $t_orig === $e_att ? '  media ok   ' : "  media WARN (row {$i} differs from EN) " ) . "{$tag}[{$i}].{$sub_def['name']} target {$t_att} → EN original {$t_orig}, EN {$e_att}";
			}
		}
		$merged[] = $m;
	}
	return $merged;
};

WP_CLI::log( $p5c_prefix . "Plan on {$p5c_expected_home} (lang {$p5c_lang}):" );
foreach ( $p5c_posts as $p5c_pk => $p5c_post ) {
	list( $p5c_en, $p5c_id ) = $p5c_ids[ $p5c_pk ];
	$p5c_ctx                 = array( 'pk' => $p5c_pk, 'slug' => $p5c_post['slug'] );
	$p5c_c = 0;
	$p5c_u = 0;
	$p5c_a = 0;
	$p5c_fields = $p5c_post['fields'];
	if ( 'en' !== $p5c_lang && 'project' === $p5c_post['type'] ) {
		$p5c_fields[] = array(
			'key'   => $p5c_copy_sync_field,
			'label' => 'projectsProjectData.displayOrder',
			'value' => get_field( $p5c_copy_sync_field, $p5c_en, false ),
			'sync'  => true,
		);
	}
	foreach ( $p5c_fields as $p5c_field ) {
		$p5c_key   = $p5c_field['key'];
		$p5c_def_f = $p5c_def( $p5c_key );
		$p5c_old   = get_field( $p5c_key, $p5c_id, false );
		$p5c_enraw = get_field( $p5c_key, $p5c_en, false );
		$p5c_names = (array) ( $p5c_field['subfields'] ?? array() );
		$p5c_tag   = "{$p5c_post['slug']}/{$p5c_lang} {$p5c_field['label']}";
		$p5c_diff  = 0;
		$p5c_ap    = 0;
		if ( ! empty( $p5c_field['sync'] ) ) {
			WP_CLI::log( "  ↺ copy-sync  {$p5c_tag} from EN " . $p5c_short( $p5c_field['value'] ) );
		}
		if ( 'group' === ( $p5c_def_f['type'] ?? '' ) ) {
			// Group merge (§3.4): raw group keyed by sub-field key; only content sub-keys change, nested repeaters by index.
			$p5c_old_g = is_array( $p5c_old ) ? $p5c_old : array();
			$p5c_en_g  = is_array( $p5c_enraw ) ? $p5c_enraw : array();
			$p5c_shape = array();
			foreach ( $p5c_old_g as $p5c_sk => $p5c_sv ) {
				$p5c_shape[] = $p5c_sk . ':' . ( is_array( $p5c_sv ) ? count( $p5c_sv ) . ' rows' : gettype( $p5c_sv ) );
			}
			WP_CLI::log( "  · raw shape  {$p5c_tag} {" . implode( ', ', $p5c_shape ) . '}' );
			$p5c_new = $p5c_old_g;
			foreach ( $p5c_field['value'] as $p5c_sk => $p5c_sv ) {
				$p5c_sname = $p5c_def( $p5c_sk )['name'];
				if ( is_array( $p5c_sv ) ) {
					$p5c_new[ $p5c_sk ] = $p5c_repeater( $p5c_ctx, $p5c_sk, "{$p5c_def_f['name']}_{$p5c_sname}", $p5c_sv, $p5c_old_g[ $p5c_sk ] ?? array(), $p5c_en_g[ $p5c_sk ] ?? array(), $p5c_names, $p5c_diff, $p5c_c, $p5c_u, $p5c_ap );
				} else {
					$p5c_new[ $p5c_sk ] = $p5c_scalar( "{$p5c_tag}.{$p5c_sname}", $p5c_old_g[ $p5c_sk ] ?? '', $p5c_sv, $p5c_diff, $p5c_c, $p5c_u );
				}
			}
		} elseif ( is_array( $p5c_field['value'] ) ) {
			$p5c_new = $p5c_repeater( $p5c_ctx, $p5c_key, $p5c_def_f['name'], $p5c_field['value'], $p5c_old, $p5c_enraw, $p5c_names, $p5c_diff, $p5c_c, $p5c_u, $p5c_ap );
		} else {
			$p5c_new = $p5c_scalar( $p5c_tag, $p5c_old, $p5c_field['value'], $p5c_diff, $p5c_c, $p5c_u );
		}
		$p5c_a += $p5c_ap;
		if ( $p5c_diff > 0 || $p5c_ap > 0 ) {
			$p5c_plan[] = array( $p5c_pk, $p5c_id, $p5c_key, $p5c_tag, $p5c_new, $p5c_old, $p5c_field );
		}
	}
	$p5c_changes += $p5c_c;
	$p5c_same    += $p5c_u;
	$p5c_appends += $p5c_a;
	$p5c_totals[] = sprintf( '  %s/%s: %d changes (%d appended rows), %d unchanged (id %d)', $p5c_post['slug'], $p5c_lang, $p5c_c, $p5c_a, $p5c_u, $p5c_id );
}
foreach ( $p5c_totals as $p5c_line ) {
	WP_CLI::log( $p5c_line );
}
WP_CLI::log( "TOTAL: {$p5c_changes} changes ({$p5c_appends} appended rows), {$p5c_same} unchanged" );
if ( $p5c_media ) {
	WP_CLI::log( 'Media report (read-only, never aborts):' );
	foreach ( $p5c_media as $p5c_line ) {
		WP_CLI::log( $p5c_line );
	}
}

// ---- Cross-language probe (§3.7): raw meta of every content key on the other languages' posts ---------------------
$p5c_probe = static function () use ( $p5c_posts, $p5c_ids, $p5c_others, $p5c_def, $p5c_translation ) {
	$out = array();
	foreach ( $p5c_posts as $pk => $post ) {
		$names = array();
		foreach ( $post['fields'] as $field ) {
			$names[] = $p5c_def( $field['key'] )['name'];
		}
		if ( 'project' === $post['type'] ) {
			$names[] = $p5c_def( 'field_p5_projectsprojectdata_display_order' )['name'];
		}
		foreach ( $p5c_others as $lang ) {
			$en  = $p5c_ids[ $pk ][0];
			$pid = 'en' === $lang ? $en : $p5c_translation( $en, $post['type'], $lang );
			if ( ! $pid ) {
				$out[ "{$pk}/{$lang}" ] = 'no-translation';
				continue;
			}
			wp_cache_delete( $pid, 'post_meta' );
			$meta = array();
			foreach ( (array) get_post_meta( $pid ) as $mk => $mv ) {
				foreach ( $names as $name ) {
					if ( $mk === $name || 0 === strpos( $mk, $name . '_' ) ) {
						$meta[ $mk ] = $mv;
						break;
					}
				}
			}
			ksort( $meta );
			$out[ "{$pk}/{$lang}" ] = $pid . ':' . count( $meta ) . ':' . substr( hash( 'sha256', (string) wp_json_encode( $meta ) ), 0, 16 );
		}
	}
	return $out;
};

if ( $p5c_dry_run ) {
	WP_CLI::log( 'Cross-language probe (' . implode( ', ', $p5c_others ) . '): ' . wp_json_encode( $p5c_probe() ) );
	WP_CLI::success( 'Dry run: nothing written.' );
	return;
}
if ( 0 === count( $p5c_plan ) ) {
	WP_CLI::success( 'Nothing to write: 0 changes (0 appended rows).' );
	return;
}

// ---- 8. Write (whole field per changed key; groups as the whole merged group) -----------------------------------------
$p5c_probe_before = $p5c_probe();
foreach ( $p5c_plan as list( $p5c_pk, $p5c_id, $p5c_key, $p5c_tag, $p5c_new ) ) {
	update_field( $p5c_key, $p5c_new, $p5c_id );
	WP_CLI::log( "  wrote  {$p5c_tag}" );
}

// ---- 9. Read-back by key (raw get_field) and by meta name (get_post_meta) ---------------------------------------------
$p5c_failed     = 0;
$p5c_same_value = static function ( $a, $b ) {
	return wp_json_encode( $a ) === wp_json_encode( $b ) || ( is_scalar( $a ) && is_scalar( $b ) && (string) $a === (string) $b )
		|| ( ( null === $a || '' === $a ) && ( null === $b || '' === $b ) );
};
/*
 * Leaves of a written value: [ label, meta name, path in the raw get_field value, expected, origin ].
 * origin: '' (written from content), 'carried over' (kept from the target), 'appended' (new row).
 */
$p5c_leaves = static function ( $def, $new, $old, array $content, $prefix, $meta, array $path ) use ( &$p5c_leaves, $p5c_def, $p5c_rows ) {
	$out  = array();
	$type = $def['type'] ?? '';
	if ( 'group' === $type ) {
		foreach ( $new as $sk => $sv ) {
			$sdef = acf_get_field( $sk );
			if ( ! $sdef ) {
				continue;
			}
			$in  = array_key_exists( $sk, $content );
			$sub = $p5c_leaves( $sdef, $sv, $old[ $sk ] ?? null, $in && is_array( $content[ $sk ] ) ? $content[ $sk ] : array(), "{$prefix}.{$sdef['name']}", "{$meta}_{$sdef['name']}", array_merge( $path, array( $sk ) ) );
			foreach ( $sub as $leaf ) {
				if ( ! $in && '' === $leaf[4] ) {
					$leaf[4] = 'carried over';
				}
				$out[] = $leaf;
			}
		}
		return $out;
	}
	if ( 'repeater' === $type ) {
		$rows     = $p5c_rows( $new );
		$old_rows = $p5c_rows( $old );
		$out[]    = array( "{$prefix} rows", $meta, $path, count( $rows ), '', true );
		foreach ( $rows as $i => $row ) {
			foreach ( $row as $sk => $sv ) {
				$sdef   = acf_get_field( $sk );
				$name   = $sdef['name'] ?? $sk;
				$origin = $i >= count( $old_rows ) ? 'appended' : ( array_key_exists( $sk, $content[ $i ] ?? array() ) ? '' : 'carried over' );
				if ( $sdef && in_array( $sdef['type'] ?? '', array( 'repeater', 'group' ), true ) ) {
					// Nested repeater/group kept from the target (e.g. packages_elements_N_features): its meta is a row count.
					foreach ( $p5c_leaves( $sdef, $sv, $old_rows[ $i ][ $sk ] ?? null, array(), "{$prefix}[{$i}].{$name}", "{$meta}_{$i}_{$name}", array_merge( $path, array( $i, $sk ) ) ) as $leaf ) {
						$leaf[4] = $origin;
						$out[]   = $leaf;
					}
					continue;
				}
				$out[] = array( "{$prefix}[{$i}].{$name}", "{$meta}_{$i}_{$name}", array_merge( $path, array( $i, $sk ) ), $sv, $origin );
			}
		}
		return $out;
	}
	return array( array( $prefix, $meta, $path, $new, '' ) );
};
foreach ( $p5c_plan as list( $p5c_pk, $p5c_id, $p5c_key, $p5c_tag, $p5c_new, $p5c_old, $p5c_field ) ) {
	$p5c_def_f = $p5c_def( $p5c_key );
	$p5c_got   = get_field( $p5c_key, $p5c_id, false );
	wp_cache_delete( $p5c_id, 'post_meta' );
	$p5c_content_value = is_array( $p5c_field['value'] ) ? $p5c_field['value'] : array();
	foreach ( $p5c_leaves( $p5c_def_f, $p5c_new, $p5c_old, $p5c_content_value, $p5c_tag, $p5c_def_f['name'], array() ) as $p5c_leaf ) {
		list( $p5c_label, $p5c_meta, $p5c_path, $p5c_expect, $p5c_origin ) = $p5c_leaf;
		$p5c_is_count = ! empty( $p5c_leaf[5] );
		// By meta name.
		$p5c_ok = $p5c_same_value( get_post_meta( $p5c_id, $p5c_meta, true ), $p5c_expect );
		// By key: the raw get_field value at the same path (sub-field keys; rows by position).
		$p5c_raw = $p5c_got;
		foreach ( $p5c_path as $p5c_step ) {
			if ( ! is_array( $p5c_raw ) ) {
				$p5c_raw = null;
				break;
			}
			$p5c_raw = is_int( $p5c_step ) ? ( array_values( $p5c_raw )[ $p5c_step ] ?? null ) : ( $p5c_raw[ $p5c_step ] ?? null );
		}
		if ( $p5c_is_count ) {
			$p5c_raw = is_array( $p5c_raw ) ? count( $p5c_raw ) : 0;
		}
		$p5c_ok = $p5c_ok && $p5c_same_value( $p5c_raw, $p5c_expect );
		$p5c_suffix = '' === $p5c_origin ? '' : " ({$p5c_origin})";
		WP_CLI::log( ( $p5c_ok ? '  ok    ' : '  FAIL  ' ) . "{$p5c_label}{$p5c_suffix}  [meta {$p5c_meta}]" );
		$p5c_failed += $p5c_ok ? 0 : 1;
	}
}
$p5c_probe_after = $p5c_probe();
WP_CLI::log( 'Cross-language probe before: ' . wp_json_encode( $p5c_probe_before ) );
WP_CLI::log( 'Cross-language probe after:  ' . wp_json_encode( $p5c_probe_after ) );
if ( $p5c_probe_before !== $p5c_probe_after ) {
	++$p5c_failed;
	WP_CLI::log( '  FAIL  values of ' . implode( '/', $p5c_others ) . ' posts changed' );
}
if ( $p5c_failed ) {
	WP_CLI::error( "{$p5c_failed} read-back check(s) failed. Restore with: wp db import <backup> && wp cache flush" );
}
WP_CLI::success( count( $p5c_plan ) . " field(s) written ({$p5c_changes} changes, {$p5c_appends} appended rows), all read back ok. Next: wp cache flush, then a dry-run must print 0 changes (0 appended rows)." );
