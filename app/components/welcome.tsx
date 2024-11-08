import React, { useState } from "react";

type WelcomeProps = {
    onRequest: (query: string) => void;
};

export function Welcome({ onRequest }: WelcomeProps) {
    const [input, setInput] = useState("");

    const handleRequest = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onRequest(input);
        }
    };

    return (
      <div className="w-full min-h-screen bg-rosepine-base flex justify-center items-center">
          <form onSubmit={handleRequest}>
              <input
                className="border-rosepine-highlightHigh bg-transparent w-full resize-none"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter your query"
                style={{ padding: "8px", width: "100%", marginBottom: "10px" }}
              />
              <button type="submit" style={{ padding: "10px 20px" }}>
                  Generate
              </button>
          </form>
      </div>
    );
}
