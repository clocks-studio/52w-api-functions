const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const crypto = require('crypto')

const token = process.env.DO_ACCESS_TOKEN; 
const appId = process.env.DO_APP_ID;
const shopifyWebhookSignature = process.env.SHOPIFY_WEBHOOK_SIGNATURE;

const deployUrl = `https://api.digitalocean.com/v2/apps/${appId}/deployments`
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
};
const payload = {
  "force_build": true
};

exports.handler = async function (event, context) {
  console.log('headers', event.headers)
  console.log(context)

  try {
    if (!token) {
      console.warn('DigitalOcean Personal Access Token required')

      return {
        statusCode: 202,
        body: JSON.stringify({ success: false, message: 'DigitalOcean Personal Access Token required' })
      }
    }

    if (!shopifyWebhookSignature) {
      console.warn('Shopify webhook signature required')

      return {
        statusCode: 202,
        body: JSON.stringify({ success: false, message: 'Shopify webhook signature required' })
      }
    }

    console.log('Shopify Header', event.headers['x-shopify-hmac-sha256'])

    // Check if the required header is present
    if (!event.headers || !event.headers['x-shopify-hmac-sha256']) {
      console.warn('Missing Shopify HMAC header')

      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing Shopify HMAC header' }),
      };
    }
    
    // Retrieve the value of the header
    const shopifyHmacHeader = event.headers['x-shopify-hmac-sha256'];

    // Retrieve the request body
    const requestBody = event.body;

    // Verify the HMAC
    const calculatedHmac = crypto
      .createHmac('sha256', shopifyWebhookSignature)
      .update(requestBody, 'utf8')
      .digest('base64');

    // console.log(calculatedHmac)

    if (calculatedHmac !== shopifyHmacHeader) {
      console.log('Shopify hash is incorrect')

      // Allow shopify to keep webhook
      return {
        statusCode: 200,
        body: JSON.stringify({ error: 'Invalid webhook' }),
      };
    }      

    // const response = await fetch(deployUrl, {
    //   method: 'POST',
    //   headers,
    //   body: JSON.stringify(payload),
    // });

    // const data = await response.json();

    // console.log(data)

    // return {
    //   statusCode: response.status,
    //   body: JSON.stringify(data),
    // };

    return {}
  } catch (error) {
    console.log(error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};