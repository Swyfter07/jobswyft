
export interface OpenAIResponse {
    content: string;
    error?: string;
}

export async function callOpenAI(
    apiKey: string,
    messages: { role: "system" | "user"; content: string }[],
    model: string = "gpt-4o-mini",
    responseFormat: "text" | "json_object" = "text",
    count = 0
): Promise<OpenAIResponse> {
    if (!apiKey) {
        return { content: "", error: "No API Key provided." };
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                response_format: responseFormat === "json_object" ? { type: "json_object" } : undefined,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
        }

        const json = await response.json();
        const content = json.choices[0]?.message?.content || "";

        return { content };
    } catch (e: any) {
        console.error("OpenAI Call Error:", e);
        if (count < 3) {
            console.log("Retrying OpenAI call...");
            return callOpenAI(apiKey, messages, model, responseFormat, count + 1);
        }
        return { content: "", error: e.message || "Unknown error occurred" };
    }
}

export async function generateCompletion(params: {
    apiKey: string;
    model: string;
    messages: { role: "system" | "user" | "assistant"; content: string }[];
    responseFormat?: "text" | "json_object";
}): Promise<string> {
    const response = await callOpenAI(
        params.apiKey,
        params.messages.map(m => ({ role: m.role as "system" | "user", content: m.content })),
        params.model,
        params.responseFormat
    );

    if (response.error) {
        throw new Error(response.error);
    }

    return response.content;
}
