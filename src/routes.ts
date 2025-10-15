import { Env, ChatMessage } from "./types";

/**
 * Handles login API requests
 */
export async function handleLoginRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
  const { username, password } = (await request.json()) as { username?: string; password?: string };
    // Dummy authentication logic
    if (username === "admin" && password === "password") {
      return new Response(
        JSON.stringify({ success: true, message: "Login successful" }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid credentials" }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to process login request" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}

/**
 * Handles chat API requests
 */
export async function handleChatRequest(
  request: Request,
  env: Env,
  sysPrompt: string,
): Promise<Response> {
  // define secrets pulled from the Cloudflare dashboard
  const GATEWAY_TOKEN = env.LLM_CHAT_APP;
  const gateway = env.AI.gateway("neural-fab")
  try {
    // Parse JSON request body
    const { messages = [] } = (await request.json()) as {
      messages: ChatMessage[];
    };

    // Add system prompt if not present
    if (!messages.some((msg) => msg.role === "system")) {
      messages.unshift({ role: "system", content: sysPrompt });
    }
    // Model ID for Workers AI model
    // https://developers.cloudflare.com/workers-ai/models/
    const MODEL_ID = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
    const response = await env.AI.run(
      MODEL_ID
      {
        messages,
        max_tokens: 1024,
      },
      {
        returnRawResponse: true,
        // Uncomment to use AI Gateway
        gateway: {
          id: "neural-fab",//env.GATEWAY_ID, //"", // Replace with your AI Gateway ID
          skipCache: false,      // Set to true to bypass cache
          cacheTtl: 3600,        // Cache time-to-live in seconds
        },
      },
    ); 

        // Return streaming response
    return response;
  } catch (error) {
    console.error("Error processing chat request:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
