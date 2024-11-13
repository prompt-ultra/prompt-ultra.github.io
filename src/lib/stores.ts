import OpenAI from "openai";
import { writable, get } from "svelte/store";

export let apiKey = writable(localStorage.getItem("apiKey") || "");
apiKey.subscribe((value) => localStorage.setItem("apiKey", value));

export let openai: OpenAI;

export const checkKey = async () => {
  if (get(apiKey) === "") {
    let key = window.prompt("Please enter your OpenAI API key");
    if (key === null) return false;
    apiKey.set(key);
  }
  openai = new OpenAI({ apiKey: get(apiKey), dangerouslyAllowBrowser: true });
  return await openai.models
    .list()
    .then((res) => {
      return true;
    })
    .catch((error) => {
      if (error.status === 401) {
        apiKey.set("");
        alert("Invalid API key");
        return false;
      }
      alert("Error: " + error.response.data.error.message);
      return false;
    });
};

export let models = [
  "gpt-3.5-turbo",
  "gpt-3.5-turbo-0125",
  "gpt-3.5-turbo-1106",
  "gpt-3.5-turbo-16k",
  "gpt-3.5-turbo-instruct",
  "gpt-3.5-turbo-instruct-0914",
  "gpt-4",
  "gpt-4-0125-preview",
  "gpt-4-0613",
  "gpt-4-1106-preview",
  "gpt-4-turbo",
  "gpt-4-turbo-2024-04-09",
  "gpt-4-turbo-preview",
  "gpt-4o",
  "gpt-4o-2024-05-13",
  "gpt-4o-2024-08-06",
  "gpt-4o-audio-preview",
  "gpt-4o-audio-preview-2024-10-01",
  "gpt-4o-mini",
  "gpt-4o-mini-2024-07-18",
  "gpt-4o-realtime-preview",
  "gpt-4o-realtime-preview-2024-10-01",
];
