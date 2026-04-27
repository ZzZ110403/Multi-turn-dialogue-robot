const API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const MODEL_ID = "qwen3.6-plus";

const apiKeyInput = document.getElementById("apiKey");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const chatContainer = document.getElementById("chatContainer");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");

// 维护完整对话历史，实现多轮上下文。
let messages = [];

function appendMessage(role, content) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  div.textContent = content;
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

function clearError() {
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
}

function setLoading(isLoading) {
  loadingEl.classList.toggle("hidden", !isLoading);
  sendBtn.disabled = isLoading;
  clearBtn.disabled = isLoading;
}

async function sendMessage() {
  clearError();

  const apiKey = apiKeyInput.value.trim();
  const content = userInput.value.trim();

  if (!apiKey) {
    showError("请先输入 API Key。");
    return;
  }

  if (!content) {
    showError("请输入问题后再发送。");
    return;
  }

  appendMessage("user", content);
  messages.push({ role: "user", content });
  userInput.value = "";

  setLoading(true);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`请求失败（${response.status}）：${errorText}`);
    }

    const data = await response.json();
    const assistantReply = data?.choices?.[0]?.message?.content;

    if (!assistantReply) {
      throw new Error("接口返回为空，未获取到助手回复。");
    }

    appendMessage("assistant", assistantReply);
    messages.push({ role: "assistant", content: assistantReply });
  } catch (err) {
    showError(err.message || "请求失败，请稍后重试。");
  } finally {
    setLoading(false);
  }
}

function clearConversation() {
  messages = [];
  chatContainer.innerHTML = "";
  clearError();
  appendMessage("system", "对话已清空，你可以开始新的提问。");
}

sendBtn.addEventListener("click", sendMessage);
clearBtn.addEventListener("click", clearConversation);

userInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

appendMessage("system", "欢迎使用 AI 学习助手，请输入 API Key 和问题开始对话。");
