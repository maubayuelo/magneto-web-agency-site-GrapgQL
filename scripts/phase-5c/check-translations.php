<?php
/**
 * Phase 5c — translation-post checklist checker. READ-ONLY (spec docs/specs/phase-5c-loader.md rev 3.1 §4, AC-4).
 *
 *   wp eval-file <repo>/scripts/phase-5c/check-translations.php [lang=fr|es]
 *
 * One line per checklist row (13, or the rows of one language), then "N/13 PASS" (or N/<rows>).
 * No host guard on purpose: it may be run read-only in production (release-day note 2). It calls no write function.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( "Run with: wp eval-file scripts/phase-5c/check-translations.php [lang=fr|es]\n" );
}

$p5t_args = (array) ( $args ?? array() );
$p5t_only = '';
foreach ( $p5t_args as $p5t_arg ) {
	if ( 0 === strpos( (string) $p5t_arg, 'lang=' ) ) {
		$p5t_only = substr( (string) $p5t_arg, 5 );
	}
}
if ( '' !== $p5t_only && ! in_array( $p5t_only, array( 'fr', 'es' ), true ) ) {
	WP_CLI::error( 'lang must be fr or es.' );
}
WP_CLI::log( 'home_url(): ' . home_url() . ' · ' . gmdate( 'Y-m-d H:i:s' ) . ' UTC' );

// Checklist rows (spec §5): [ #, type, EN slug, lang, title ].
$p5t_rows = array(
	array( 1, 'page', 'services', 'fr', 'Services' ),
	array( 2, 'page', 'packages', 'fr', 'Forfaits' ),
	array( 3, 'page', 'about-magneto', 'fr', 'À propos' ),
	array( 4, 'page', 'contact', 'fr', 'Contact' ),
	array( 5, 'page', 'services', 'es', 'Servicios' ),
	array( 6, 'page', 'packages', 'es', 'Paquetes' ),
	array( 7, 'page', 'about-magneto', 'es', 'Sobre Magneto' ),
	array( 8, 'page', 'contact', 'es', 'Contacto' ),
	array( 9, 'page', 'projects', 'es', 'Proyectos' ),
	array( 10, 'project', 'fashion-company-ecommerce', 'fr', 'Dangel Wellness' ),
	array( 11, 'project', 'shamaniccas-ecommerce', 'fr', 'Shamanicca' ),
	array( 12, 'project', 'fashion-company-ecommerce', 'es', 'Dangel Wellness' ),
	array( 13, 'project', 'shamaniccas-ecommerce', 'es', 'Shamanicca' ),
);
// Copy repeaters shown per type (meta name → field key, for image sub-fields).
$p5t_repeaters = array(
	'page'    => array( 'services' => 'field_689a5f0dc2a9b', 'packages_elements' => 'field_689a4b0bfdf48', 'sections' => 'field_p5_packagescontentsections_sections' ),
	'project' => array( 'project_data_challenges' => '', 'project_data_solutions' => '', 'project_data_results' => '', 'images' => 'field_689a6d04467f9' ),
);

$p5t_lang_of = static function ( $id ) {
	$details = apply_filters( 'wpml_post_language_details', null, $id );
	return is_array( $details ) ? ( $details['language_code'] ?? '' ) : '';
};
$p5t_en_ids = static function ( $type, $slug ) use ( $p5t_lang_of ) {
	$found = get_posts(
		array(
			'post_type'        => $type,
			'name'             => $slug,
			'post_status'      => array( 'publish', 'draft', 'pending', 'private', 'future' ),
			'numberposts'      => -1,
			'fields'           => 'ids',
			'suppress_filters' => true,
		)
	);
	return array_values( array_filter( $found, static function ( $id ) use ( $p5t_lang_of ) { return 'en' === $p5t_lang_of( $id ); } ) );
};
$p5t_rows_of = static function ( $id, $meta ) {
	$n = get_post_meta( $id, $meta, true );
	return '' === $n ? '-' : (int) $n;
};

$p5t_pass  = 0;
$p5t_total = 0;
$p5t_warns = 0;
foreach ( $p5t_rows as list( $p5t_n, $p5t_type, $p5t_slug, $p5t_lang, $p5t_title ) ) {
	if ( '' !== $p5t_only && $p5t_only !== $p5t_lang ) {
		continue;
	}
	++$p5t_total;
	$p5t_fail = array();
	$p5t_en   = $p5t_en_ids( $p5t_type, $p5t_slug );
	if ( 1 !== count( $p5t_en ) ) {
		WP_CLI::log( sprintf( '#%-2d FAIL %s %s/%s: %d EN posts (expected 1)', $p5t_n, $p5t_type, $p5t_slug, $p5t_lang, count( $p5t_en ) ) );
		continue;
	}
	$p5t_en  = (int) $p5t_en[0];
	$p5t_tid = (int) apply_filters( 'wpml_object_id', $p5t_en, $p5t_type, false, $p5t_lang );
	if ( ! $p5t_tid || $p5t_tid === $p5t_en ) {
		WP_CLI::log( sprintf( '#%-2d FAIL %s %s (EN %d) → no %s translation', $p5t_n, $p5t_type, $p5t_slug, $p5t_en, $p5t_lang ) );
		continue;
	}
	$p5t_post  = get_post( $p5t_tid );
	$p5t_tlang = $p5t_lang_of( $p5t_tid );
	$p5t_trid  = apply_filters( 'wpml_element_trid', null, $p5t_tid, 'post_' . $p5t_type );
	$p5t_entr  = apply_filters( 'wpml_element_trid', null, $p5t_en, 'post_' . $p5t_type );
	$p5t_dup   = (string) get_post_meta( $p5t_tid, '_icl_lang_duplicate_of', true );
	$p5t_g_t   = count( (array) acf_get_field_groups( array( 'post_id' => $p5t_tid ) ) );
	$p5t_g_en  = count( (array) acf_get_field_groups( array( 'post_id' => $p5t_en ) ) );

	if ( $p5t_tlang !== $p5t_lang ) {
		$p5t_fail[] = "lang {$p5t_tlang}";
	}
	if ( $p5t_post->post_name !== $p5t_slug ) {
		$p5t_fail[] = "slug {$p5t_post->post_name}";
	}
	if ( 'publish' !== $p5t_post->post_status ) {
		$p5t_fail[] = "status {$p5t_post->post_status}";
	}
	if ( ! $p5t_trid || (int) $p5t_trid !== (int) $p5t_entr ) {
		$p5t_fail[] = "trid {$p5t_trid} ≠ EN {$p5t_entr}";
	}
	if ( '' !== $p5t_dup ) {
		$p5t_fail[] = "dup_of {$p5t_dup} (not detached)";
	}
	if ( $p5t_g_t !== $p5t_g_en ) {
		$p5t_fail[] = "ACF groups {$p5t_g_t} ≠ EN {$p5t_g_en}";
	}

	$p5t_ok = ! $p5t_fail;
	$p5t_pass += $p5t_ok ? 1 : 0;
	WP_CLI::log(
		sprintf(
			'#%-2d %s %s %s EN %d → %d %s · post_name %s · %s · "%s"%s · trid %s · dup_of %s · groups %d/%d%s',
			$p5t_n,
			$p5t_ok ? 'PASS' : 'FAIL',
			$p5t_type,
			$p5t_slug,
			$p5t_en,
			$p5t_tid,
			$p5t_tlang,
			$p5t_post->post_name,
			$p5t_post->post_status,
			$p5t_post->post_title,
			$p5t_post->post_title === $p5t_title ? '' : " (checklist title: \"{$p5t_title}\")",
			$p5t_trid,
			'' === $p5t_dup ? 'none' : $p5t_dup,
			$p5t_g_t,
			$p5t_g_en,
			$p5t_ok ? '' : ' · FAIL: ' . implode( '; ', $p5t_fail )
		)
	);

	// Copy repeater rows (informational) and media report (§3.6, informational: never fails a row).
	$p5t_counts = array();
	foreach ( $p5t_repeaters[ $p5t_type ] as $p5t_meta => $p5t_key ) {
		$p5t_r_t  = $p5t_rows_of( $p5t_tid, $p5t_meta );
		$p5t_r_en = $p5t_rows_of( $p5t_en, $p5t_meta );
		if ( '-' === $p5t_r_t && '-' === $p5t_r_en ) {
			continue;
		}
		$p5t_counts[] = "{$p5t_meta} {$p5t_r_t}/{$p5t_r_en}" . ( $p5t_r_t === $p5t_r_en ? '' : ( $p5t_r_t < $p5t_r_en ? ' (below EN)' : ' (ABOVE EN)' ) );
		if ( '' === $p5t_key || '-' === $p5t_r_t ) {
			continue;
		}
		$p5t_def = acf_get_field( $p5t_key );
		foreach ( (array) ( $p5t_def ? acf_get_fields( $p5t_def ) : array() ) as $p5t_sub ) {
			if ( 'image' !== ( $p5t_sub['type'] ?? '' ) ) {
				continue;
			}
			$p5t_ok_n = 0;
			$p5t_bad  = array();
			for ( $p5t_i = 0; $p5t_i < (int) $p5t_r_t; $p5t_i++ ) {
				$p5t_mk   = "{$p5t_meta}_{$p5t_i}_{$p5t_sub['name']}";
				$p5t_att  = (int) get_post_meta( $p5t_tid, $p5t_mk, true );
				$p5t_eatt = (int) get_post_meta( $p5t_en, $p5t_mk, true );
				$p5t_orig = $p5t_att ? (int) apply_filters( 'wpml_object_id', $p5t_att, 'attachment', true, 'en' ) : 0;
				if ( $p5t_orig === $p5t_eatt ) {
					++$p5t_ok_n;
				} else {
					$p5t_bad[] = "row {$p5t_i}: {$p5t_att}→{$p5t_orig} vs EN {$p5t_eatt}";
				}
			}
			if ( $p5t_bad ) {
				$p5t_warns += count( $p5t_bad );
				WP_CLI::log( "      media WARN {$p5t_meta}.{$p5t_sub['name']} (" . implode( '; ', $p5t_bad ) . ')' );
			} else {
				WP_CLI::log( "      media ok   {$p5t_meta}.{$p5t_sub['name']} ({$p5t_ok_n} rows)" );
			}
		}
	}
	WP_CLI::log( '      rows (target/EN): ' . ( $p5t_counts ? implode( ' · ', $p5t_counts ) : '—' ) );
}

WP_CLI::log( "media WARN rows: {$p5t_warns}" );
WP_CLI::log( "{$p5t_pass}/{$p5t_total} PASS" );
