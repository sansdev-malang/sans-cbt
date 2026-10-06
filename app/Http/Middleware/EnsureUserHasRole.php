<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Ensure the authenticated user has one of the given roles.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        $hasAllowedRole = $user instanceof User
            && $user->role !== null
            && in_array($user->role->value, $roles, true);

        abort_unless($hasAllowedRole, 403);

        return $next($request);
    }
}
