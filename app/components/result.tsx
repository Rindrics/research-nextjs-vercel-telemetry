import React from "react";
import type { PartialGeneratedObject } from "../schema";

type ResultProps = {
  query: string;
  generatedObject: PartialGeneratedObject;
  completed: boolean;
  onReset: () => void;
};

export function Result({ query, generatedObject, completed, onReset }: ResultProps) {
  const formatJson = (obj: any) => {
    return Object.entries(obj).map(([key, value]) => (
        <div key={key} className="flex flex-col">
            <div>
                <span className="text-gray-500">{key}: </span>
                <span className="whitespace-pre-wrap break-words">{value as string}</span>
            </div>
        </div>
    ));
  };

  return (
    <div className="w-full min-h-screen flex justify-center py-8 gap-8">
        <div className="pl-2 w-[600px] flex flex-col gap-4">
            <h2>Query: {query}</h2>
            <div className="flex">
                <pre className="whitespace-pre-wrap break-words w-full">{formatJson(generatedObject)}</pre>
            </div>
            <button onClick={onReset} style={{ marginTop: "20px" }}>
                Back
            </button>
        </div>
    </div>
  );
}
