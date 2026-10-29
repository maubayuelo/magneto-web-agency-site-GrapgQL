<?php
/**
 * Phase 5a — local EN fixtures (state N). LOCAL ONLY. Superseded by the Phase 5c loader.
 *
 * Spec: docs/specs/phase-5a-structure-shared-home-about-cases.md → "Field map for the EN fixtures".
 * Copy: docs/content/magneto-copy-en.md at 23b620a (line refs next to each value). Values are verbatim,
 * except: Markdown bold markers removed, testimonial “ ” removed (TestimonialCard adds them), and two-paragraph
 * final-CTA subtitles (Services 404+406, Packages 526+528) joined with one space (`subtitle` is a `text` field).
 *
 * Run (Mauricio), from ~/Local Sites/magneto-cms-2/app/public, after a fresh backup (Hard rule 10):
 *   wp db export ~/Documents/projects/magneto/backups/phase-5a/magneto-cms-2_phase5a-fixtures-before_$(date +%Y%m%d-%H%M).sql
 *   wp eval-file <repo>/scripts/phase-5a/local-fixtures.php            # writes, then reads back
 *   wp eval-file <repo>/scripts/phase-5a/local-fixtures.php dry-run    # prints the plan, writes nothing
 *
 * Idempotent: every value is set (repeaters are replaced as a whole), nothing is appended.
 * Writes EN posts only, except `display_order`, which is also written to the FR/ES project translations
 * (ACFML Copy only copies on a WPML translation save, ADR 0006).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( "Run with: wp eval-file scripts/phase-5a/local-fixtures.php\n" );
}

$expected_home = 'http://magneto-cms-2.local';
if ( untrailingslashit( home_url() ) !== $expected_home ) {
	WP_CLI::error( 'Aborted: home_url() is ' . home_url() . ", expected {$expected_home}. This script is local only." );
}
if ( ! function_exists( 'update_field' ) ) {
	WP_CLI::error( 'Aborted: ACF is not active.' );
}

$dry_run = in_array( 'dry-run', (array) ( $args ?? array() ), true );

// ---- Posts (EN), checked by type + slug before any write ----------------------------------------------------
$posts = array(
	'home'       => array( 2, 'page', 'home' ),
	'about'      => array( 32, 'page', 'about-magneto' ),
	'services'   => array( 34, 'page', 'services' ),
	'packages'   => array( 36, 'page', 'packages' ),
	'dangel'     => array( 270, 'project', 'fashion-company-ecommerce' ),
	'trepied'    => array( 498, 'project', 'trepied-trepied-ca' ),
	'shamanicca' => array( 224, 'project', 'shamaniccas-ecommerce' ),
);
foreach ( $posts as $label => list( $id, $type, $slug ) ) {
	$lang = apply_filters( 'wpml_post_language_details', null, $id );
	if ( get_post_type( $id ) !== $type || get_post_field( 'post_name', $id ) !== $slug || ( $lang['language_code'] ?? '' ) !== 'en' ) {
		WP_CLI::error( "Aborted: post {$id} is not the EN {$type} '{$slug}' ({$label})." );
	}
}
$id = static function ( $label ) use ( $posts ) {
	return $posts[ $label ][0];
};

// ---- Field keys (docs/acf/phase-5-field-groups.json) ---------------------------------------------------------
const P5A_CTA = array(
	'title'              => 'field_689a58f65e417',
	'subtitle'           => 'field_689a592f5e419',
	'cta_text'           => 'field_689a59405e41a',
	'cta_path'           => 'field_p5_finalctasection_cta_path',
	'secondary_cta_text' => 'field_p5_finalctasection_secondary_cta_text',
	'secondary_cta_path' => 'field_p5_finalctasection_secondary_cta_path',
);

$writes = array(); // [ post id, field key, value, description ]
$add    = static function ( $post_id, $key, $value, $what ) use ( &$writes ) {
	$writes[] = array( $post_id, $key, $value, $what );
};
$final_cta = static function ( $post_id, $label, $title, $subtitle, $cta_text, $cta_path = '', $secondary_text = '', $secondary_path = '' ) use ( $add ) {
	$add( $post_id, P5A_CTA['title'], $title, "{$label} finalCtaSection.title" );
	$add( $post_id, P5A_CTA['subtitle'], $subtitle, "{$label} finalCtaSection.subtitle" );
	$add( $post_id, P5A_CTA['cta_text'], $cta_text, "{$label} finalCtaSection.ctaText" );
	$add( $post_id, P5A_CTA['cta_path'], $cta_path, "{$label} finalCtaSection.ctaPath" );
	$add( $post_id, P5A_CTA['secondary_cta_text'], $secondary_text, "{$label} finalCtaSection.secondaryCtaText" );
	$add( $post_id, P5A_CTA['secondary_cta_path'], $secondary_path, "{$label} finalCtaSection.secondaryCtaPath" );
};

// ---- Home: Meet Magneto (30 / 32, 34, 36) --------------------------------------------------------------------
$add( $id( 'home' ), 'field_689a5bb77c99c', 'Work directly with the person who plans, designs and builds your website.', 'home homeAboutSection.aboutSectionTitle (30)' );
$add(
	$id( 'home' ),
	'field_p5_homeaboutsection_description_html',
	"<p>Magneto is a founder-led web consulting practice in Montreal. You work directly with Mauricio from strategy and UX/UI through development and launch.</p>\n"
	. "<p>Magneto primarily works with wellness professionals, therapists and professional service businesses that need a website that is clearer, more credible and easier to use.</p>\n"
	. '<p>Available in English, French and Spanish.</p>',
	'home homeAboutSection.descriptionHtml (32, 34, 36)'
);

// ---- Home: featured services BUILD / FIX / CARE (40-62); icons reused (O4): row 3 reuses the web-dev icon -------
$current_services = get_field( 'field_689a5395d1bc9', $id( 'home' ), false ) ?: array();
$icon_funnel      = $current_services[0]['field_689a53d7d1bcc'] ?? '';
$icon_webdev      = $current_services[1]['field_689a53d7d1bcc'] ?? $icon_funnel;
$service_row      = static function ( $title, $tagline, $description, $icon, $anchor ) {
	return array(
		'field_689a53b3d1bca'                                   => $title,
		'field_p5_homefeaturedservices_service_service_tagline' => $tagline,
		'field_689a53c7d1bcb'                                   => $description,
		'field_689a53d7d1bcc'                                   => $icon,
		'field_689a5402d1bcd'                                   => $anchor,
	);
};
$add(
	$id( 'home' ),
	'field_689a5395d1bc9',
	array(
		$service_row( 'BUILD', 'A website that explains your business clearly.', 'New websites, rebuilds and focused landing pages planned around what visitors need to understand and the action you want them to take.', $icon_funnel, 'build' ),
		$service_row( 'FIX', 'Improve the website you already have — without rebuilding it unnecessarily.', 'For websites that are confusing, slow, awkward on mobile, or have problems with forms or booking. Magneto diagnoses what matters first, you approve what gets fixed, and the result is verified.', $icon_webdev, 'fix' ),
		$service_row( 'CARE', 'Keep your website maintained and working.', 'CARE keeps a stable website updated, monitored and supported so you do not have to manage the technical details yourself.', $icon_webdev, 'care' ),
	),
	'home homeFeaturedServices.service (3 rows: 40-44, 48-52, 56-60)'
);

// ---- Home: testimonials (90-102); the 4 placeholder rows are replaced (local only) ---------------------------
$testimonial_row = static function ( $author, $quote, $role, $company, $city, $note ) {
	return array(
		'field_689a52d93cd54'                                => $author,
		'field_689a52e73cd55'                                => $quote,
		'field_p5_hometestimonialssection_testimonials_role'    => $role,
		'field_p5_hometestimonialssection_testimonials_company' => $company,
		'field_p5_hometestimonialssection_testimonials_city'    => $city,
		'field_p5_hometestimonialssection_testimonials_note'    => $note,
		'field_689a52f03cd56'                                => '',
	);
};
$add(
	$id( 'home' ),
	'field_689a37f1b1fb8',
	array(
		$testimonial_row( 'Dangel Manik', 'Very professional. Mauricio understood my work from the start and knew how to create what I need. The result exceeds my expectations, and working with him was simple and very satisfying.', 'Holistic therapist', '', 'Montreal', 'Translated from Spanish.' ),
		$testimonial_row( 'Israel Valencia Vázquez', 'Great experience working with Mauricio (Magneto). He understood our needs and turned them into an attractive, functional and professional website. We highly recommend Magneto!', 'Founder & video producer', 'TRÉPIED', '', '' ),
	),
	'home homeTestimonialsSection.testimonials (2 rows: 90/93/96, 100/102)'
);

// ---- Home: footer line (130) ---------------------------------------------------------------------------------
$add( $id( 'home' ), 'field_68b33adfb508b', 'Based in Montreal · Available in English, French & Spanish', 'home homeFooter.footerLine2 (130)' );

// ---- Final CTAs ----------------------------------------------------------------------------------------------
// Home (122 / 124 / 126); ctaLink (prefooter_cta_link) unchanged.
$add( $id( 'home' ), P5A_CTA['title'], 'Start with a conversation.', 'home finalCtaSection.title (122)' );
$add( $id( 'home' ), P5A_CTA['subtitle'], 'Share what is and is not working with your website. Magneto will help determine whether the sensible next step is a new website, a focused fix, ongoing care — or no major intervention yet.', 'home finalCtaSection.subtitle (124)' );
$add( $id( 'home' ), P5A_CTA['cta_text'], 'Book a Strategy Call', 'home finalCtaSection.ctaText (126)' );
// About (232 / 234 / 236).
$final_cta( $id( 'about' ), 'about-magneto', 'Start with a conversation.', 'Share what is and is not working with your website. Magneto will help determine the most sensible next step.', 'Book a Strategy Call' );
// Services (402 / 404+406 / primary 408, no path → modal / secondary 410 → /contact).
$final_cta( $id( 'services' ), 'services', 'Not sure which path fits your website?', 'You do not need to decide between BUILD, FIX or CARE before getting in touch. Start by explaining what is happening with the website. Magneto will recommend the most sensible next step before defining the scope.', 'Book a Strategy Call', '', 'Tell me about your project', '/contact' );
// Packages (524 / 526+528 / primary 530 → /contact / secondary 532, no path → modal).
$final_cta( $id( 'packages' ), 'packages', 'Not sure where your project fits?', 'You do not need to choose BUILD, FIX or CARE before getting in touch. Share what is happening with your website and what you want to improve, and Magneto will point you to the most sensible path and range.', 'Tell me about your project', '/contact', 'Book a Strategy Call', '' );
// Projects page: left empty (the copy has no final CTA → home fallback).
// Case studies (958+960+962 / 1069+1071+1073 / 1204+1206+1208).
$case_cta_body = 'Magneto can help determine whether the right next step is a new website, a focused fix or ongoing care.';
$final_cta( $id( 'dangel' ), 'project 270', 'Need a website that has to make several services easier to understand and act on?', $case_cta_body, 'Book a Strategy Call' );
$final_cta( $id( 'trepied' ), 'project 498', 'Have a website that needs to present your services and work more clearly?', $case_cta_body, 'Book a Strategy Call' );
$final_cta( $id( 'shamanicca' ), 'project 224', 'Have a website that needs to bring several parts of your business together clearly?', $case_cta_body, 'Book a Strategy Call' );

// ---- Projects: card description (76 / 80 / 84) ----------------------------------------------------------------
$add( $id( 'dangel' ), 'field_p5_projectsprojectdata_card_description', 'A French, English and Spanish website for a Montreal wellness professional, presenting several services clearly with direct ways to get in touch or book.', 'project 270 cardDescription (76)' );
$add( $id( 'trepied' ), 'field_p5_projectsprojectdata_card_description', 'A website for a Montreal video production studio, designed to present its work clearly and guide prospective clients toward a call or quote request.', 'project 498 cardDescription (80)' );
$add( $id( 'shamanicca' ), 'field_p5_projectsprojectdata_card_description', "Magneto's own project: an online shop and blog combined in one website, with shared search and newsletter signup.", 'project 224 cardDescription (84)' );

// ---- Projects: display order (72), EN + every existing FR/ES translation ----------------------------------------
foreach ( array( 'dangel' => 10, 'shamanicca' => 20, 'trepied' => 40 ) as $label => $order ) {
	$add( $id( $label ), 'field_p5_projectsprojectdata_display_order', $order, "project {$id( $label )} displayOrder (72)" );
	foreach ( array( 'fr', 'es' ) as $lang ) {
		$tr = apply_filters( 'wpml_object_id', $id( $label ), 'project', false, $lang );
		if ( $tr && (int) $tr !== $id( $label ) ) {
			$add( (int) $tr, 'field_p5_projectsprojectdata_display_order', $order, "project {$tr} ({$lang} of {$id( $label )}) displayOrder (72)" );
		}
	}
}

// ---- About page: founder (169, 171) and bottom CTA (214) -----------------------------------------------------
$add(
	$id( 'about' ),
	'field_p5_aboutdata_description_html',
	"<p>Magneto is the web consulting practice of <strong>Mauricio Bayuelo</strong>, a Montreal-based web consultant, UX/UI designer and front-end developer.</p>\n"
	. '<p>You work directly with Mauricio from the first conversation through strategy, design, development and launch. There is one point of contact, and the person recommending the solution is also involved in building it.</p>',
	'about-magneto aboutData.descriptionHtml (169, 171)'
);
$add( $id( 'about' ), 'field_p5_aboutdata_cta_text', 'Tell me about your project', 'about-magneto aboutData.ctaText (214)' );
$add( $id( 'about' ), 'field_p5_aboutdata_cta_path', '/contact', 'about-magneto aboutData.ctaPath' );

// ---- Observe Copy-field side effects on FR/ES home (WPML may sync Copy meta on update) -------------------------
$sync_probe = static function () {
	$out = array();
	foreach ( array( 535 => 'fr', 536 => 'es' ) as $post_id => $lang ) {
		$out[ $lang ] = array(
			'testimonials' => get_post_meta( $post_id, 'testimonials', true ),
			'service'      => get_post_meta( $post_id, 'service', true ),
		);
	}
	return wp_json_encode( $out );
};

// ---- Run --------------------------------------------------------------------------------------------------------
WP_CLI::log( ( $dry_run ? '[dry-run] ' : '' ) . count( $writes ) . " writes planned on {$expected_home}" );
$before_probe = $sync_probe();
$failed       = 0;
foreach ( $writes as list( $post_id, $key, $value, $what ) ) {
	if ( $dry_run ) {
		WP_CLI::log( "  plan  {$what}: " . mb_substr( is_array( $value ) ? wp_json_encode( $value, JSON_UNESCAPED_UNICODE ) : (string) $value, 0, 100 ) );
		continue;
	}
	if ( ! acf_get_field( $key ) ) {
		WP_CLI::warning( "field {$key} not found — is phase-5-field-groups.json imported? ({$what})" );
		++$failed;
		continue;
	}
	update_field( $key, $value, $post_id );
}
if ( $dry_run ) {
	WP_CLI::success( 'Dry run: nothing written.' );
	return;
}

// ---- Read back (raw values, by key) -----------------------------------------------------------------------------
foreach ( $writes as list( $post_id, $key, $value, $what ) ) {
	$got = get_field( $key, $post_id, false );
	if ( is_array( $value ) ) {
		$ok = is_array( $got ) && count( $got ) === count( $value );
		if ( $ok ) {
			foreach ( $value as $i => $row ) {
				foreach ( $row as $sub_key => $sub_value ) {
					$ok = $ok && (string) ( $got[ $i ][ $sub_key ] ?? '' ) === (string) $sub_value;
				}
			}
		}
	} else {
		$ok = (string) $got === (string) $value;
	}
	if ( ! $ok ) {
		++$failed;
	}
	WP_CLI::log( ( $ok ? '  ok    ' : '  FAIL  ' ) . $what );
}
WP_CLI::log( "FR/ES home Copy meta (row counts) before: {$before_probe}" );
WP_CLI::log( 'FR/ES home Copy meta (row counts) after:  ' . $sync_probe() );

if ( $failed ) {
	WP_CLI::error( "{$failed} write(s) failed the read-back." );
}
WP_CLI::success( count( $writes ) . ' values written and read back. Restore point: the db export taken before this run.' );
