export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // 1. Handle video playback requests
    if (url.pathname.startsWith('/videos/')) {
      const videoKey = url.pathname.replace('/videos/', '');
      const video = await env.MY_BUCKET.get(videoKey);
      
      return new Response(video.body, {
        headers: {
          'Content-Type': 'video/mp4',
          'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        }
      });
    }

    // 2. Handle uploads (your existing code)
    if (request.method === 'POST') {
      // ... your upload logic ...
    }

    return new Response('Not found', { status: 404 });
  }
}