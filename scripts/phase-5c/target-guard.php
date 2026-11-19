<?php
/**
 * Phase 5c loader — host / target guard (release runbook §B2, D-R2 + D-R2a).
 *
 * Pure function, no WordPress: load-content.php requires this file and calls p5c_target_guard() before any other guard;
 * target-guard.test.php tests it with plain PHP.
 *
 * Allowed pairs, exact after removing trailing slashes (as untrailingslashit()):
 *   no target          → http://magneto-cms-2.local          (local, the default)
 *   target=production  → http://cms.magnetomarketing.co      (production)
 *   target=rehearsal   → http://magneto-prod-rehearsal.local (rehearsal on a production copy)
 * Anything else aborts: an unknown or empty target, case variants, a host / target mismatch, and a production or
 * rehearsal host with no target. No flag or env var overrides this.
 */

/**
 * @param string|null $target   The target= argument, or null when it is absent.
 * @param string      $home_url home_url() of the site the loader runs on.
 * @return string|null null when the pair is allowed, otherwise the abort message.
 */
function p5c_target_guard( ?string $target, string $home_url ): ?string {
	$hosts = array(
		''           => 'http://magneto-cms-2.local',
		'production' => 'http://cms.magnetomarketing.co',
		'rehearsal'  => 'http://magneto-prod-rehearsal.local',
	);
	if ( null !== $target && ( '' === $target || ! isset( $hosts[ $target ] ) ) ) {
		return "target={$target} is not allowed. Use no target (local), target=production or target=rehearsal.";
	}
	$key      = $target ?? '';
	$expected = $hosts[ $key ];
	$actual   = rtrim( $home_url, '/\\' );
	if ( $actual !== $expected ) {
		$label = null === $target ? 'no target (local)' : "target={$target}";
		return "home_url() is {$home_url}, expected {$expected} for {$label}.";
	}
	return null;
}
