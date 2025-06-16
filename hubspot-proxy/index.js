const https = require('https');

exports.handler = async (event) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }

    try {
        const hubspotPath = event.pathParameters?.proxy || '';
        const hubspotAccessToken = process.env.HUBSPOT_ACCESS_TOKEN;
        
        let fullUrl = `https://api.hubapi.com/${hubspotPath}`;
        console.log("Calling HubSpot URL:", fullUrl);
        console.log("Token status:", {
            isUndefined: typeof hubspotAccessToken === 'undefined',
            isNull: hubspotAccessToken === null,
            isEmpty: hubspotAccessToken === '',
            value: hubspotAccessToken ? "✅ present" : "❌ missing"
        });
        if (event.queryStringParameters) {
            const queryString = new URLSearchParams(event.queryStringParameters).toString();
            fullUrl += `?${queryString}`;
        }

        const response = await makeHttpRequest(fullUrl, {
            method: event.httpMethod,
            headers: {
                'Authorization': `Bearer ${hubspotAccessToken}`,
                'Content-Type': 'application/json'
            }
        }, event.body);

        return {
            statusCode: response.statusCode,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
            },
            body: response.body
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

function makeHttpRequest(url, options, body) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const requestOptions = {
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname + urlObj.search,
            method: options.method,
            headers: options.headers
        };

        const req = https.request(requestOptions, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => responseBody += chunk);
            res.on('end', () => resolve({
                statusCode: res.statusCode,
                body: responseBody
            }));
        });

        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}
