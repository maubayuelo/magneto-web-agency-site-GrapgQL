<?php
/**
 * Tests for p5c_target_guard() (release runbook §B2 step 3). Plain PHP, no WordPress.
 *
 * Run: php scripts/phase-5c/target-guard.test.php
 * Exits 0 when every case passes, 1 on any failure.
 */

require_once __DIR__ . '/target-guard.php';

$local      = 'http://magneto-cms-2.local';
$production = 'http://cms.magnetomarketing.co';
$rehearsal  = 'http://magneto-prod-rehearsal.local';

// [ §B2 case, description, target (null = absent), home_url, expect allowed ].
$cases = array(
	array( '1', 'no target + local host', null, $local, true ),
	array( '1', 'no target + local host with trailing /', null, $local . '/', true ),
	array( '2', 'no target + production host', null, $production, false ),
	array( '2', 'no target + production host with trailing /', null, $production . '/', false ),
	array( '3', 'no target + rehearsal host', null, $rehearsal, false ),
	array( '4', 'production + production host', 'production', $production, true ),
	array( '4', 'production + production host with trailing /', 'production', $production . '/', true ),
	array( '5', 'production + local host', 'production', $local, false ),
	array( '6', 'production + https production host', 'production', 'https://cms.magnetomarketing.co', false ),
	array( '6', 'production + https production host with trailing /', 'production', 'https://cms.magnetomarketing.co/', false ),
	array( '6', 'production + www production host', 'production', 'http://www.cms.magnetomarketing.co', false ),
	array( '6', 'production + production host with a path', 'production', $production . '/wp', false ),
	array( '7', 'rehearsal + rehearsal host', 'rehearsal', $rehearsal, true ),
	array( '7', 'rehearsal + rehearsal host with trailing /', 'rehearsal', $rehearsal . '/', true ),
	array( '8', 'rehearsal + production host', 'rehearsal', $production, false ),
	array( '+', 'rehearsal + local host', 'rehearsal', $local, false ),
	array( '9', 'PRODUCTION + production host', 'PRODUCTION', $production, false ),
	array( '9', 'Production + production host', 'Production', $production, false ),
	array( '9', 'prod + production host', 'prod', $production, false ),
	array( '9', 'empty target + production host', '', $production, false ),
	array( '9', 'empty target + local host', '', $local, false ),
	array( '+', 'REHEARSAL + rehearsal host', 'REHEARSAL', $rehearsal, false ),
	array( '+', 'local (explicit) + local host', 'local', $local, false ),
	array( '+', "' production' (leading space) + production host", ' production', $production, false ),
	array( '+', "'production ' (trailing space) + production host", 'production ', $production, false ),
);

$failed = 0;
foreach ( $cases as list( $case, $desc, $target, $home, $allowed ) ) {
	$result = p5c_target_guard( $target, $home );
	$ok     = $allowed ? null === $result : ( is_string( $result ) && '' !== $result );
	$failed += $ok ? 0 : 1;
	printf(
		"%s  case %s  %-52s → %s\n",
		$ok ? 'PASS' : 'FAIL',
		$case,
		$desc,
		null === $result ? 'allowed' : 'abort: ' . $result
	);
}

printf( "%d cases, %d passed, %d failed\n", count( $cases ), count( $cases ) - $failed, $failed );
exit( $failed > 0 ? 1 : 0 );
