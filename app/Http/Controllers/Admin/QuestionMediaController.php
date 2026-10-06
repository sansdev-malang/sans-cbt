<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class QuestionMediaController extends Controller
{
    /**
     * Stream question media from the private disk; images are never exposed via a public URL.
     */
    public function __invoke(string $path): BinaryFileResponse|StreamedResponse
    {
        abort_unless(preg_match('/^[A-Za-z0-9._-]+$/', $path) === 1, 404);

        $disk = Storage::disk('local');
        $relative = 'question-media/'.$path;

        abort_unless($disk->exists($relative), 404);

        return $disk->response($relative);
    }
}
