export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Key',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Verify auth key - using your R2_SECRET_KEY
      const authKey = request.headers.get('X-Auth-Key');
      if (authKey !== env.R2_SECRET_KEY) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }

      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: corsHeaders });
      }

      const formData = await request.formData();
      const file = formData.get('file');

      if (!file) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'No file provided' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Safe filename handling - this fixes the original error
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      
      // Get file extension from type or default to webm
      let extension = 'webm';
      if (file.type) {
        if (file.type.includes('mp4')) extension = 'mp4';
        else if (file.type.includes('webm')) extension = 'webm';
        else if (file.type.includes('mov')) extension = 'mov';
      }
      
      const safeFilename = `video_${timestamp}_${randomId}.${extension}`;
      const key = `uploads/${safeFilename}`;

      console.log('Processing upload:', { 
        originalName: file.name || 'unknown', 
        safeFilename, 
        size: file.size, 
        type: file.type,
        key
      });

      // Upload to R2 using the MY_BUCKET binding
      await env.MY_BUCKET.put(key, file.stream(), {
        metadata: {
          'content-type': file.type || 'video/webm',
          'uploaded-at': new Date().toISOString(),
          'original-name': file.name || 'unknown',
          'file-size': file.size.toString()
        }
      });

      // For now, return a placeholder URL - you'll need to set up a custom domain later
      const fileUrl = `https://pub-YOUR_BUCKET_ID.r2.dev/${key}`;
      
      console.log('Upload successful:', { key, fileUrl });
      
      return new Response(JSON.stringify({
        success: true,
        url: fileUrl,
        key: key,
        filename: safeFilename,
        size: file.size,
        type: file.type
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Upload error:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        message: `Upload failed: ${error.message}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};