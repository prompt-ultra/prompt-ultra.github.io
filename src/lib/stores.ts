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
