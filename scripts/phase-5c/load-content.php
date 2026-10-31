<?php
/**
 * Phase 5c loader (part 1) — LOCAL EN: Services, Packages, page heroes. LOCAL ONLY. Run by Mauricio, never by agents.
 *
 * Spec: docs/specs/phase-5c-loader.md rev 2, with the 5b §5.4 override (docs/specs/phase-5b-services-packages-seo.md
 * rev 9): cta_text_hero "Book a Free Strategy Call" on services, home, about-magneto and projects; cta_link_hero is
 * never written. Values come only from scripts/phase-5c/content/en.json (the single transcription of the copy).
 *
 * Run from Local's "Open site shell" (one command at a time):
 *   wp eval-file <repo>/scripts/phase-5c/load-content.php dry-run
 *   wp eval-file <repo>/scripts/phase-5c/load-content.php backup=<.sql file exported in the last 3 hours>
 * Optional: content=<path to a content JSON> (default: content/en.json next to this file; used for the guard proof).
 *
 * Order: guards → preflight (nothing written if any check fails) → plan (dry-run prints it and stops) → write →
 * read-back by key → FR/ES row-count probe. No deletes, no post/title/slug/status changes, no options, no WPML writes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( "Run with: wp eval-file scripts/phase-5c/load-content.php dry-run\n" );
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

// ---- 2. Backup guard (real run only) ---------------------------------------------------------------------------------
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

// ---- 3. Preflight --------------------------------------------------------------------------------------------------
if ( ! function_exists( 'update_field' ) || ! function_exists( 'acf_get_field' ) ) {
	$p5c_abort( 'ACF is not active.' );
}
$p5c_repo         = dirname( __DIR__, 2 );
$p5c_content_path = $p5c_opt( 'content' ) ?: __DIR__ . '/content/en.json';
$p5c_content      = json_decode( (string) file_get_contents( $p5c_content_path ), true );
if ( ! is_array( $p5c_content ) || empty( $p5c_content['posts'] ) || empty( $p5c_content['source']['file'] ) ) {
	$p5c_abort( "content file missing or invalid: {$p5c_content_path}" );
}
$p5c_source = $p5c_repo . '/' . $p5c_content['source']['file'];
if ( ! is_file( $p5c_source ) || hash_file( 'sha256', $p5c_source ) !== $p5c_content['source']['sha256'] ) {
	$p5c_abort( "source.sha256 does not match {$p5c_content['source']['file']} (content: {$p5c_content_path})." );
}
WP_CLI::log( "Content: {$p5c_content_path} · source {$p5c_content['source']['file']} sha256 " . substr( $p5c_content['source']['sha256'], 0, 12 ) . '… ok' );

// Every key (and repeater sub-field key) exists.
foreach ( $p5c_content['posts'] as $p5c_post ) {
	foreach ( $p5c_post['fields'] as $p5c_field ) {
		if ( ! acf_get_field( $p5c_field['key'] ) ) {
			$p5c_abort( "field {$p5c_field['key']} ({$p5c_field['label']}) not found — is phase-5-field-groups.json imported?" );
		}
		foreach ( array_keys( (array) ( $p5c_field['subfields'] ?? array() ) ) as $p5c_sub ) {
			if ( ! acf_get_field( $p5c_sub ) ) {
				$p5c_abort( "sub-field {$p5c_sub} of {$p5c_field['label']} not found." );
			}
		}
	}
}

// Each post resolved by post_type + post_name + WPML language (no hardcoded IDs): exactly one EN post.
$p5c_lang_of = static function ( $id ) {
	$details = apply_filters( 'wpml_post_language_details', null, $id );
	return is_array( $details ) ? ( $details['language_code'] ?? '' ) : '';
};
$p5c_ids = array();
foreach ( $p5c_content['posts'] as $p5c_post ) {
	if ( 'en' !== $p5c_post['lang'] ) {
		$p5c_abort( "this revision writes EN only ({$p5c_post['slug']}: {$p5c_post['lang']})." );
	}
	$p5c_found = get_posts(
		array(
			'post_type'        => $p5c_post['type'],
			'name'             => $p5c_post['slug'],
			'post_status'      => array( 'publish', 'draft', 'pending', 'private', 'future' ),
			'numberposts'      => -1,
			'fields'           => 'ids',
			'suppress_filters' => true, // all languages; filtered below
		)
	);
	$p5c_en = array_values( array_filter( $p5c_found, static function ( $id ) use ( $p5c_lang_of ) { return 'en' === $p5c_lang_of( $id ); } ) );
	if ( 1 !== count( $p5c_en ) ) {
		$p5c_abort( "{$p5c_post['type']} '{$p5c_post['slug']}' resolves to " . count( $p5c_en ) . ' EN posts (expected exactly 1).' );
	}
	$p5c_ids[ $p5c_post['slug'] ] = (int) $p5c_en[0];
}

// EN row counts: services 7 and packages 3 (equal to the content rows); sections 0 or 2.
$p5c_count = static function ( $key, $id ) {
	$rows = get_field( $key, $id, false );
	return is_array( $rows ) ? count( $rows ) : 0;
};
$p5c_expected_rows = array(
	'field_689a5f0dc2a9b'                       => array( 7 ),
	'field_689a4b0bfdf48'                       => array( 3 ),
	'field_p5_packagescontentsections_sections' => array( 0, 2 ),
);
foreach ( $p5c_content['posts'] as $p5c_post ) {
	foreach ( $p5c_post['fields'] as $p5c_field ) {
		if ( ! is_array( $p5c_field['value'] ) ) {
			continue;
		}
		$p5c_key = $p5c_field['key'];
		if ( ! isset( $p5c_expected_rows[ $p5c_key ] ) ) {
			$p5c_abort( "repeater {$p5c_key} has no row-count rule." );
		}
		$p5c_have = $p5c_count( $p5c_key, $p5c_ids[ $p5c_post['slug'] ] );
		if ( ! in_array( $p5c_have, $p5c_expected_rows[ $p5c_key ], true ) ) {
			$p5c_abort( "{$p5c_post['slug']} {$p5c_field['label']} has {$p5c_have} rows; expected " . implode( ' or ', $p5c_expected_rows[ $p5c_key ] ) . '.' );
		}
		if ( 'field_p5_packagescontentsections_sections' !== $p5c_key && count( $p5c_field['value'] ) !== $p5c_have ) {
			$p5c_abort( "{$p5c_post['slug']} {$p5c_field['label']}: content has " . count( $p5c_field['value'] ) . " rows, CMS has {$p5c_have}." );
		}
	}
}

// ---- 4. Plan: merge by index, keep every other sub-field ------------------------------------------------------------
$p5c_short = static function ( $value ) {
	$text = is_scalar( $value ) || null === $value ? (string) $value : wp_json_encode( $value, JSON_UNESCAPED_UNICODE );
	$text = str_replace( array( "\r", "\n" ), array( '', '⏎' ), $text );
	return '"' . ( mb_strlen( $text ) > 60 ? mb_substr( $text, 0, 57 ) . '…' : $text ) . '"';
};
$p5c_plan    = array(); // [ post slug, id, key, label, new value, old raw value ]
$p5c_changes = 0;
$p5c_same    = 0;
$p5c_totals  = array();
$p5c_prefix  = $p5c_dry_run ? '[dry-run] ' : '';
WP_CLI::log( $p5c_prefix . "Plan on {$p5c_expected_home}:" );
foreach ( $p5c_content['posts'] as $p5c_post ) {
	$p5c_slug = $p5c_post['slug'];
	$p5c_id   = $p5c_ids[ $p5c_slug ];
	$p5c_totals[ $p5c_slug ] = array( 0, 0 );
	foreach ( $p5c_post['fields'] as $p5c_field ) {
		$p5c_old = get_field( $p5c_field['key'], $p5c_id, false );
		$p5c_tag = "{$p5c_slug}/en {$p5c_field['label']}";
		$p5c_diff = 0;
		if ( is_array( $p5c_field['value'] ) ) {
			$p5c_old_rows = is_array( $p5c_old ) ? array_values( $p5c_old ) : array();
			$p5c_new      = array();
			foreach ( $p5c_field['value'] as $p5c_i => $p5c_row ) {
				$p5c_merged = isset( $p5c_old_rows[ $p5c_i ] ) && is_array( $p5c_old_rows[ $p5c_i ] ) ? $p5c_old_rows[ $p5c_i ] : array();
				foreach ( $p5c_row as $p5c_sub => $p5c_value ) {
					$p5c_name = $p5c_field['subfields'][ $p5c_sub ] ?? $p5c_sub;
					$p5c_was  = $p5c_merged[ $p5c_sub ] ?? '';
					if ( (string) ( is_array( $p5c_was ) ? wp_json_encode( $p5c_was ) : $p5c_was ) === (string) $p5c_value ) {
						++$p5c_same;
						++$p5c_totals[ $p5c_slug ][1];
						WP_CLI::log( "  = unchanged  {$p5c_tag}[{$p5c_i}].{$p5c_name}" );
					} else {
						++$p5c_changes;
						++$p5c_diff;
						++$p5c_totals[ $p5c_slug ][0];
						WP_CLI::log( "  ~ change     {$p5c_tag}[{$p5c_i}].{$p5c_name}: " . $p5c_short( $p5c_was ) . ' → ' . $p5c_short( $p5c_value ) );
					}
					$p5c_merged[ $p5c_sub ] = $p5c_value;
				}
				$p5c_new[] = $p5c_merged;
			}
		} else {
			$p5c_new = $p5c_field['value'];
			if ( (string) ( is_array( $p5c_old ) ? '' : $p5c_old ) === (string) $p5c_new ) {
				++$p5c_same;
				++$p5c_totals[ $p5c_slug ][1];
				WP_CLI::log( "  = unchanged  {$p5c_tag}" );
			} else {
				++$p5c_changes;
				++$p5c_diff;
				++$p5c_totals[ $p5c_slug ][0];
				WP_CLI::log( "  ~ change     {$p5c_tag}: " . $p5c_short( $p5c_old ) . ' → ' . $p5c_short( $p5c_new ) );
			}
		}
		if ( $p5c_diff > 0 ) {
			$p5c_plan[] = array( $p5c_slug, $p5c_id, $p5c_field['key'], $p5c_tag, $p5c_new, $p5c_old, $p5c_field );
		}
	}
}
foreach ( $p5c_totals as $p5c_slug => list( $p5c_c, $p5c_u ) ) {
	WP_CLI::log( sprintf( '  post %-14s %3d changes, %3d unchanged (id %d)', $p5c_slug, $p5c_c, $p5c_u, $p5c_ids[ $p5c_slug ] ) );
}
WP_CLI::log( "TOTAL: {$p5c_changes} changes, {$p5c_same} unchanged" );

// ---- FR/ES probe: row counts of the Copy repeaters on the FR/ES translations (expected unchanged) -----------------
$p5c_probe = static function () use ( $p5c_ids ) {
	$out = array();
	foreach ( array( 'services' => array( 'services' ), 'packages' => array( 'packages_elements', 'sections' ) ) as $slug => $metas ) {
		foreach ( array( 'fr', 'es' ) as $lang ) {
			$tid = apply_filters( 'wpml_object_id', $p5c_ids[ $slug ], 'page', false, $lang );
			foreach ( $metas as $meta ) {
				$out[ "{$slug}.{$lang}.{$meta}" ] = $tid ? (string) get_post_meta( (int) $tid, $meta, true ) : 'no-translation';
			}
		}
	}
	return $out;
};

if ( $p5c_dry_run ) {
	WP_CLI::log( 'FR/ES probe (row counts): ' . wp_json_encode( $p5c_probe() ) );
	WP_CLI::success( 'Dry run: nothing written.' );
	return;
}
if ( 0 === count( $p5c_plan ) ) {
	WP_CLI::success( 'Nothing to write: 0 changes.' );
	return;
}

// ---- 5. Write (whole field per changed key) -------------------------------------------------------------------------
$p5c_probe_before = $p5c_probe();
foreach ( $p5c_plan as list( $p5c_slug, $p5c_id, $p5c_key, $p5c_tag, $p5c_new ) ) {
	update_field( $p5c_key, $p5c_new, $p5c_id );
	WP_CLI::log( "  wrote  {$p5c_tag}" );
}

// ---- 6. Read-back (raw, by key): written values + carried-over sub-fields --------------------------------------------
$p5c_failed = 0;
$p5c_same_value = static function ( $a, $b ) {
	return wp_json_encode( $a ) === wp_json_encode( $b ) || ( is_scalar( $a ) && is_scalar( $b ) && (string) $a === (string) $b );
};
foreach ( $p5c_plan as list( $p5c_slug, $p5c_id, $p5c_key, $p5c_tag, $p5c_new, $p5c_old, $p5c_field ) ) {
	$p5c_got = get_field( $p5c_key, $p5c_id, false );
	if ( is_array( $p5c_new ) ) {
		$p5c_got_rows = is_array( $p5c_got ) ? array_values( $p5c_got ) : array();
		$p5c_old_rows = is_array( $p5c_old ) ? array_values( $p5c_old ) : array();
		$p5c_ok_rows  = count( $p5c_got_rows ) === count( $p5c_new );
		WP_CLI::log( ( $p5c_ok_rows ? '  ok    ' : '  FAIL  ' ) . "{$p5c_tag} rows = " . count( $p5c_got_rows ) );
		$p5c_failed += $p5c_ok_rows ? 0 : 1;
		foreach ( $p5c_new as $p5c_i => $p5c_row ) {
			foreach ( $p5c_row as $p5c_sub => $p5c_value ) {
				$p5c_written = array_key_exists( $p5c_sub, $p5c_field['value'][ $p5c_i ] );
				$p5c_expect  = $p5c_written ? $p5c_value : ( $p5c_old_rows[ $p5c_i ][ $p5c_sub ] ?? null );
				$p5c_ok      = $p5c_same_value( $p5c_got_rows[ $p5c_i ][ $p5c_sub ] ?? null, $p5c_expect );
				$p5c_name    = $p5c_written ? ( $p5c_field['subfields'][ $p5c_sub ] ?? $p5c_sub ) : "{$p5c_sub} (carried over)";
				WP_CLI::log( ( $p5c_ok ? '  ok    ' : '  FAIL  ' ) . "{$p5c_tag}[{$p5c_i}].{$p5c_name}" );
				$p5c_failed += $p5c_ok ? 0 : 1;
			}
		}
	} else {
		$p5c_ok = (string) $p5c_got === (string) $p5c_new;
		WP_CLI::log( ( $p5c_ok ? '  ok    ' : '  FAIL  ' ) . $p5c_tag );
		$p5c_failed += $p5c_ok ? 0 : 1;
	}
}
$p5c_probe_after = $p5c_probe();
WP_CLI::log( 'FR/ES probe before: ' . wp_json_encode( $p5c_probe_before ) );
WP_CLI::log( 'FR/ES probe after:  ' . wp_json_encode( $p5c_probe_after ) );
if ( $p5c_probe_before !== $p5c_probe_after ) {
	++$p5c_failed;
	WP_CLI::log( '  FAIL  FR/ES row counts changed' );
}
if ( $p5c_failed ) {
	WP_CLI::error( "{$p5c_failed} read-back check(s) failed. Restore with: wp db import <backup> && wp cache flush" );
}
WP_CLI::success( count( $p5c_plan ) . " field(s) written, all read back ok. Next: wp cache flush, then a dry-run must print 0 changes." );
