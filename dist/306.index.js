exports.id = 306;
exports.ids = [306];
exports.modules = {

/***/ 4306:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "ChatGPTAPI": () => (/* binding */ ChatGPTAPI),
  "ChatGPTError": () => (/* binding */ ChatGPTError),
  "ChatGPTUnofficialProxyAPI": () => (/* binding */ ChatGPTUnofficialProxyAPI),
  "openai": () => (/* binding */ openai)
});

// EXTERNAL MODULE: ./node_modules/keyv/src/index.js
var src = __webpack_require__(1531);
;// CONCATENATED MODULE: ./node_modules/p-timeout/index.js
class TimeoutError extends Error {
	constructor(message) {
		super(message);
		this.name = 'TimeoutError';
	}
}

/**
An error to be thrown when the request is aborted by AbortController.
DOMException is thrown instead of this Error when DOMException is available.
*/
class AbortError extends Error {
	constructor(message) {
		super();
		this.name = 'AbortError';
		this.message = message;
	}
}

/**
TODO: Remove AbortError and just throw DOMException when targeting Node 18.
*/
const getDOMException = errorMessage => globalThis.DOMException === undefined
	? new AbortError(errorMessage)
	: new DOMException(errorMessage);

/**
TODO: Remove below function and just 'reject(signal.reason)' when targeting Node 18.
*/
const getAbortedReason = signal => {
	const reason = signal.reason === undefined
		? getDOMException('This operation was aborted.')
		: signal.reason;

	return reason instanceof Error ? reason : getDOMException(reason);
};

function pTimeout(promise, options) {
	const {
		milliseconds,
		fallback,
		message,
		customTimers = {setTimeout, clearTimeout},
	} = options;

	let timer;

	const cancelablePromise = new Promise((resolve, reject) => {
		if (typeof milliseconds !== 'number' || Math.sign(milliseconds) !== 1) {
			throw new TypeError(`Expected \`milliseconds\` to be a positive number, got \`${milliseconds}\``);
		}

		if (milliseconds === Number.POSITIVE_INFINITY) {
			resolve(promise);
			return;
		}

		if (options.signal) {
			const {signal} = options;
			if (signal.aborted) {
				reject(getAbortedReason(signal));
			}

			signal.addEventListener('abort', () => {
				reject(getAbortedReason(signal));
			});
		}

		// We create the error outside of `setTimeout` to preserve the stack trace.
		const timeoutError = new TimeoutError();

		timer = customTimers.setTimeout.call(undefined, () => {
			if (fallback) {
				try {
					resolve(fallback());
				} catch (error) {
					reject(error);
				}

				return;
			}

			if (typeof promise.cancel === 'function') {
				promise.cancel();
			}

			if (message === false) {
				resolve();
			} else if (message instanceof Error) {
				reject(message);
			} else {
				timeoutError.message = message ?? `Promise timed out after ${milliseconds} milliseconds`;
				reject(timeoutError);
			}
		}, milliseconds);

		(async () => {
			try {
				resolve(await promise);
			} catch (error) {
				reject(error);
			} finally {
				customTimers.clearTimeout.call(undefined, timer);
			}
		})();
	});

	cancelablePromise.clear = () => {
		customTimers.clearTimeout.call(undefined, timer);
		timer = undefined;
	};

	return cancelablePromise;
}

;// CONCATENATED MODULE: ./node_modules/quick-lru/index.js
class QuickLRU extends Map {
	constructor(options = {}) {
		super();

		if (!(options.maxSize && options.maxSize > 0)) {
			throw new TypeError('`maxSize` must be a number greater than 0');
		}

		if (typeof options.maxAge === 'number' && options.maxAge === 0) {
			throw new TypeError('`maxAge` must be a number greater than 0');
		}

		// TODO: Use private class fields when ESLint supports them.
		this.maxSize = options.maxSize;
		this.maxAge = options.maxAge || Number.POSITIVE_INFINITY;
		this.onEviction = options.onEviction;
		this.cache = new Map();
		this.oldCache = new Map();
		this._size = 0;
	}

	// TODO: Use private class methods when targeting Node.js 16.
	_emitEvictions(cache) {
		if (typeof this.onEviction !== 'function') {
			return;
		}

		for (const [key, item] of cache) {
			this.onEviction(key, item.value);
		}
	}

	_deleteIfExpired(key, item) {
		if (typeof item.expiry === 'number' && item.expiry <= Date.now()) {
			if (typeof this.onEviction === 'function') {
				this.onEviction(key, item.value);
			}

			return this.delete(key);
		}

		return false;
	}

	_getOrDeleteIfExpired(key, item) {
		const deleted = this._deleteIfExpired(key, item);
		if (deleted === false) {
			return item.value;
		}
	}

	_getItemValue(key, item) {
		return item.expiry ? this._getOrDeleteIfExpired(key, item) : item.value;
	}

	_peek(key, cache) {
		const item = cache.get(key);

		return this._getItemValue(key, item);
	}

	_set(key, value) {
		this.cache.set(key, value);
		this._size++;

		if (this._size >= this.maxSize) {
			this._size = 0;
			this._emitEvictions(this.oldCache);
			this.oldCache = this.cache;
			this.cache = new Map();
		}
	}

	_moveToRecent(key, item) {
		this.oldCache.delete(key);
		this._set(key, item);
	}

	* _entriesAscending() {
		for (const item of this.oldCache) {
			const [key, value] = item;
			if (!this.cache.has(key)) {
				const deleted = this._deleteIfExpired(key, value);
				if (deleted === false) {
					yield item;
				}
			}
		}

		for (const item of this.cache) {
			const [key, value] = item;
			const deleted = this._deleteIfExpired(key, value);
			if (deleted === false) {
				yield item;
			}
		}
	}

	get(key) {
		if (this.cache.has(key)) {
			const item = this.cache.get(key);

			return this._getItemValue(key, item);
		}

		if (this.oldCache.has(key)) {
			const item = this.oldCache.get(key);
			if (this._deleteIfExpired(key, item) === false) {
				this._moveToRecent(key, item);
				return item.value;
			}
		}
	}

	set(key, value, {maxAge = this.maxAge} = {}) {
		const expiry =
			typeof maxAge === 'number' && maxAge !== Number.POSITIVE_INFINITY ?
				Date.now() + maxAge :
				undefined;
		if (this.cache.has(key)) {
			this.cache.set(key, {
				value,
				expiry
			});
		} else {
			this._set(key, {value, expiry});
		}
	}

	has(key) {
		if (this.cache.has(key)) {
			return !this._deleteIfExpired(key, this.cache.get(key));
		}

		if (this.oldCache.has(key)) {
			return !this._deleteIfExpired(key, this.oldCache.get(key));
		}

		return false;
	}

	peek(key) {
		if (this.cache.has(key)) {
			return this._peek(key, this.cache);
		}

		if (this.oldCache.has(key)) {
			return this._peek(key, this.oldCache);
		}
	}

	delete(key) {
		const deleted = this.cache.delete(key);
		if (deleted) {
			this._size--;
		}

		return this.oldCache.delete(key) || deleted;
	}

	clear() {
		this.cache.clear();
		this.oldCache.clear();
		this._size = 0;
	}

	resize(newSize) {
		if (!(newSize && newSize > 0)) {
			throw new TypeError('`maxSize` must be a number greater than 0');
		}

		const items = [...this._entriesAscending()];
		const removeCount = items.length - newSize;
		if (removeCount < 0) {
			this.cache = new Map(items);
			this.oldCache = new Map();
			this._size = items.length;
		} else {
			if (removeCount > 0) {
				this._emitEvictions(items.slice(0, removeCount));
			}

			this.oldCache = new Map(items.slice(removeCount));
			this.cache = new Map();
			this._size = 0;
		}

		this.maxSize = newSize;
	}

	* keys() {
		for (const [key] of this) {
			yield key;
		}
	}

	* values() {
		for (const [, value] of this) {
			yield value;
		}
	}

	* [Symbol.iterator]() {
		for (const item of this.cache) {
			const [key, value] = item;
			const deleted = this._deleteIfExpired(key, value);
			if (deleted === false) {
				yield [key, value.value];
			}
		}

		for (const item of this.oldCache) {
			const [key, value] = item;
			if (!this.cache.has(key)) {
				const deleted = this._deleteIfExpired(key, value);
				if (deleted === false) {
					yield [key, value.value];
				}
			}
		}
	}

	* entriesDescending() {
		let items = [...this.cache];
		for (let i = items.length - 1; i >= 0; --i) {
			const item = items[i];
			const [key, value] = item;
			const deleted = this._deleteIfExpired(key, value);
			if (deleted === false) {
				yield [key, value.value];
			}
		}

		items = [...this.oldCache];
		for (let i = items.length - 1; i >= 0; --i) {
			const item = items[i];
			const [key, value] = item;
			if (!this.cache.has(key)) {
				const deleted = this._deleteIfExpired(key, value);
				if (deleted === false) {
					yield [key, value.value];
				}
			}
		}
	}

	* entriesAscending() {
		for (const [key, value] of this._entriesAscending()) {
			yield [key, value.value];
		}
	}

	get size() {
		if (!this._size) {
			return this.oldCache.size;
		}

		let oldCacheSize = 0;
		for (const key of this.oldCache.keys()) {
			if (!this.cache.has(key)) {
				oldCacheSize++;
			}
		}

		return Math.min(this._size + oldCacheSize, this.maxSize);
	}

	entries() {
		return this.entriesAscending();
	}

	forEach(callbackFunction, thisArgument = this) {
		for (const [key, value] of this.entriesAscending()) {
			callbackFunction.call(thisArgument, value, key, this);
		}
	}

	get [Symbol.toStringTag]() {
		return JSON.stringify([...this.entriesAscending()]);
	}
}

// EXTERNAL MODULE: ./node_modules/chatgpt/node_modules/uuid/dist/index.js
var dist = __webpack_require__(6201);
;// CONCATENATED MODULE: ./node_modules/chatgpt/node_modules/uuid/wrapper.mjs

const v1 = dist.v1;
const v3 = dist.v3;
const v4 = dist.v4;
const v5 = dist.v5;
const NIL = dist/* NIL */.zR;
const version = dist/* version */.i8;
const validate = dist/* validate */.Gu;
const stringify = dist/* stringify */.Pz;
const parse = dist/* parse */.Qc;

// EXTERNAL MODULE: ./node_modules/@dqbd/tiktoken/tiktoken.cjs
var tiktoken = __webpack_require__(9014);
;// CONCATENATED MODULE: ./node_modules/eventsource-parser/dist/index.js
function createParser(onParse) {
  let isFirstChunk;
  let buffer;
  let startingPosition;
  let startingFieldLength;
  let eventId;
  let eventName;
  let data;
  reset();
  return {
    feed,
    reset
  };
  function reset() {
    isFirstChunk = true;
    buffer = "";
    startingPosition = 0;
    startingFieldLength = -1;
    eventId = void 0;
    eventName = void 0;
    data = "";
  }
  function feed(chunk) {
    buffer = buffer ? buffer + chunk : chunk;
    if (isFirstChunk && hasBom(buffer)) {
      buffer = buffer.slice(BOM.length);
    }
    isFirstChunk = false;
    const length = buffer.length;
    let position = 0;
    let discardTrailingNewline = false;
    while (position < length) {
      if (discardTrailingNewline) {
        if (buffer[position] === "\n") {
          ++position;
        }
        discardTrailingNewline = false;
      }
      let lineLength = -1;
      let fieldLength = startingFieldLength;
      let character;
      for (let index = startingPosition; lineLength < 0 && index < length; ++index) {
        character = buffer[index];
        if (character === ":" && fieldLength < 0) {
          fieldLength = index - position;
        } else if (character === "\r") {
          discardTrailingNewline = true;
          lineLength = index - position;
        } else if (character === "\n") {
          lineLength = index - position;
        }
      }
      if (lineLength < 0) {
        startingPosition = length - position;
        startingFieldLength = fieldLength;
        break;
      } else {
        startingPosition = 0;
        startingFieldLength = -1;
      }
      parseEventStreamLine(buffer, position, fieldLength, lineLength);
      position += lineLength + 1;
    }
    if (position === length) {
      buffer = "";
    } else if (position > 0) {
      buffer = buffer.slice(position);
    }
  }
  function parseEventStreamLine(lineBuffer, index, fieldLength, lineLength) {
    if (lineLength === 0) {
      if (data.length > 0) {
        onParse({
          type: "event",
          id: eventId,
          event: eventName || void 0,
          data: data.slice(0, -1)
          // remove trailing newline
        });

        data = "";
        eventId = void 0;
      }
      eventName = void 0;
      return;
    }
    const noValue = fieldLength < 0;
    const field = lineBuffer.slice(index, index + (noValue ? lineLength : fieldLength));
    let step = 0;
    if (noValue) {
      step = lineLength;
    } else if (lineBuffer[index + fieldLength + 1] === " ") {
      step = fieldLength + 2;
    } else {
      step = fieldLength + 1;
    }
    const position = index + step;
    const valueLength = lineLength - step;
    const value = lineBuffer.slice(position, position + valueLength).toString();
    if (field === "data") {
      data += value ? "".concat(value, "\n") : "\n";
    } else if (field === "event") {
      eventName = value;
    } else if (field === "id" && !value.includes("\0")) {
      eventId = value;
    } else if (field === "retry") {
      const retry = parseInt(value, 10);
      if (!Number.isNaN(retry)) {
        onParse({
          type: "reconnect-interval",
          value: retry
        });
      }
    }
  }
}
const BOM = [239, 187, 191];
function hasBom(buffer) {
  return BOM.every((charCode, index) => buffer.charCodeAt(index) === charCode);
}

//# sourceMappingURL=index.js.map

;// CONCATENATED MODULE: ./node_modules/chatgpt/build/index.js
// src/chatgpt-api.ts





// src/tokenizer.ts

var tokenizer = (0,tiktoken/* get_encoding */.iw)("cl100k_base");
function encode(input) {
  return tokenizer.encode(input);
}

// src/types.ts
var ChatGPTError = class extends Error {
};
var openai;
((openai2) => {
})(openai || (openai = {}));

// src/fetch.ts
var fetch = globalThis.fetch;

// src/fetch-sse.ts


// src/stream-async-iterable.ts
async function* streamAsyncIterable(stream) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

// src/fetch-sse.ts
async function fetchSSE(url, options, fetch2 = fetch) {
  const { onMessage, onError, ...fetchOptions } = options;
  const res = await fetch2(url, fetchOptions);
  if (!res.ok) {
    let reason;
    try {
      reason = await res.text();
    } catch (err) {
      reason = res.statusText;
    }
    const msg = `ChatGPT error ${res.status}: ${reason}`;
    const error = new ChatGPTError(msg, { cause: res });
    error.statusCode = res.status;
    error.statusText = res.statusText;
    throw error;
  }
  const parser = createParser((event) => {
    if (event.type === "event") {
      onMessage(event.data);
    }
  });
  const feed = (chunk) => {
    var _a;
    let response = null;
    try {
      response = JSON.parse(chunk);
    } catch {
    }
    if (((_a = response == null ? void 0 : response.detail) == null ? void 0 : _a.type) === "invalid_request_error") {
      const msg = `ChatGPT error ${response.detail.message}: ${response.detail.code} (${response.detail.type})`;
      const error = new ChatGPTError(msg, { cause: response });
      error.statusCode = response.detail.code;
      error.statusText = response.detail.message;
      if (onError) {
        onError(error);
      } else {
        console.error(error);
      }
      return;
    }
    parser.feed(chunk);
  };
  if (!res.body.getReader) {
    const body = res.body;
    if (!body.on || !body.read) {
      throw new ChatGPTError('unsupported "fetch" implementation');
    }
    body.on("readable", () => {
      let chunk;
      while (null !== (chunk = body.read())) {
        feed(chunk.toString());
      }
    });
  } else {
    for await (const chunk of streamAsyncIterable(res.body)) {
      const str = new TextDecoder().decode(chunk);
      feed(str);
    }
  }
}

// src/chatgpt-api.ts
var CHATGPT_MODEL = "gpt-3.5-turbo";
var USER_LABEL_DEFAULT = "User";
var ASSISTANT_LABEL_DEFAULT = "ChatGPT";
var ChatGPTAPI = class {
  /**
   * Creates a new client wrapper around OpenAI's chat completion API, mimicing the official ChatGPT webapp's functionality as closely as possible.
   *
   * @param apiKey - OpenAI API key (required).
   * @param apiOrg - Optional OpenAI API organization (optional).
   * @param apiBaseUrl - Optional override for the OpenAI API base URL.
   * @param debug - Optional enables logging debugging info to stdout.
   * @param completionParams - Param overrides to send to the [OpenAI chat completion API](https://platform.openai.com/docs/api-reference/chat/create). Options like `temperature` and `presence_penalty` can be tweaked to change the personality of the assistant.
   * @param maxModelTokens - Optional override for the maximum number of tokens allowed by the model's context. Defaults to 4096.
   * @param maxResponseTokens - Optional override for the minimum number of tokens allowed for the model's response. Defaults to 1000.
   * @param messageStore - Optional [Keyv](https://github.com/jaredwray/keyv) store to persist chat messages to. If not provided, messages will be lost when the process exits.
   * @param getMessageById - Optional function to retrieve a message by its ID. If not provided, the default implementation will be used (using an in-memory `messageStore`).
   * @param upsertMessage - Optional function to insert or update a message. If not provided, the default implementation will be used (using an in-memory `messageStore`).
   * @param fetch - Optional override for the `fetch` implementation to use. Defaults to the global `fetch` function.
   */
  constructor(opts) {
    const {
      apiKey,
      apiOrg,
      apiBaseUrl = "https://api.openai.com/v1",
      debug = false,
      messageStore,
      completionParams,
      systemMessage,
      maxModelTokens = 4e3,
      maxResponseTokens = 1e3,
      getMessageById,
      upsertMessage,
      fetch: fetch2 = fetch
    } = opts;
    this._apiKey = apiKey;
    this._apiOrg = apiOrg;
    this._apiBaseUrl = apiBaseUrl;
    this._debug = !!debug;
    this._fetch = fetch2;
    this._completionParams = {
      model: CHATGPT_MODEL,
      temperature: 0.8,
      top_p: 1,
      presence_penalty: 1,
      ...completionParams
    };
    this._systemMessage = systemMessage;
    if (this._systemMessage === void 0) {
      const currentDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      this._systemMessage = `You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible.
Knowledge cutoff: 2021-09-01
Current date: ${currentDate}`;
    }
    this._maxModelTokens = maxModelTokens;
    this._maxResponseTokens = maxResponseTokens;
    this._getMessageById = getMessageById ?? this._defaultGetMessageById;
    this._upsertMessage = upsertMessage ?? this._defaultUpsertMessage;
    if (messageStore) {
      this._messageStore = messageStore;
    } else {
      this._messageStore = new src({
        store: new QuickLRU({ maxSize: 1e4 })
      });
    }
    if (!this._apiKey) {
      throw new Error("OpenAI missing required apiKey");
    }
    if (!this._fetch) {
      throw new Error("Invalid environment; fetch is not defined");
    }
    if (typeof this._fetch !== "function") {
      throw new Error('Invalid "fetch" is not a function');
    }
  }
  /**
   * Sends a message to the OpenAI chat completions endpoint, waits for the response
   * to resolve, and returns the response.
   *
   * If you want your response to have historical context, you must provide a valid `parentMessageId`.
   *
   * If you want to receive a stream of partial responses, use `opts.onProgress`.
   *
   * Set `debug: true` in the `ChatGPTAPI` constructor to log more info on the full prompt sent to the OpenAI chat completions API. You can override the `systemMessage` in `opts` to customize the assistant's instructions.
   *
   * @param message - The prompt message to send
   * @param opts.parentMessageId - Optional ID of the previous message in the conversation (defaults to `undefined`)
   * @param opts.conversationId - Optional ID of the conversation (defaults to `undefined`)
   * @param opts.messageId - Optional ID of the message to send (defaults to a random UUID)
   * @param opts.systemMessage - Optional override for the chat "system message" which acts as instructions to the model (defaults to the ChatGPT system message)
   * @param opts.timeoutMs - Optional timeout in milliseconds (defaults to no timeout)
   * @param opts.onProgress - Optional callback which will be invoked every time the partial response is updated
   * @param opts.abortSignal - Optional callback used to abort the underlying `fetch` call using an [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
   * @param completionParams - Optional overrides to send to the [OpenAI chat completion API](https://platform.openai.com/docs/api-reference/chat/create). Options like `temperature` and `presence_penalty` can be tweaked to change the personality of the assistant.
   *
   * @returns The response from ChatGPT
   */
  async sendMessage(text, opts = {}) {
    const {
      parentMessageId,
      messageId = v4(),
      timeoutMs,
      onProgress,
      stream = onProgress ? true : false,
      completionParams,
      conversationId
    } = opts;
    let { abortSignal } = opts;
    let abortController = null;
    if (timeoutMs && !abortSignal) {
      abortController = new AbortController();
      abortSignal = abortController.signal;
    }
    const message = {
      role: "user",
      id: messageId,
      conversationId,
      parentMessageId,
      text
    };
    const latestQuestion = message;
    const { messages, maxTokens, numTokens } = await this._buildMessages(
      text,
      opts
    );
    const result = {
      role: "assistant",
      id: v4(),
      conversationId,
      parentMessageId: messageId,
      text: ""
    };
    const responseP = new Promise(
      async (resolve, reject) => {
        var _a, _b;
        const url = `${this._apiBaseUrl}/chat/completions`;
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this._apiKey}`
        };
        const body = {
          max_tokens: maxTokens,
          ...this._completionParams,
          ...completionParams,
          messages,
          stream
        };
        if (this._apiOrg) {
          headers["OpenAI-Organization"] = this._apiOrg;
        }
        if (this._debug) {
          console.log(`sendMessage (${numTokens} tokens)`, body);
        }
        if (stream) {
          fetchSSE(
            url,
            {
              method: "POST",
              headers,
              body: JSON.stringify(body),
              signal: abortSignal,
              onMessage: (data) => {
                var _a2;
                if (data === "[DONE]") {
                  result.text = result.text.trim();
                  return resolve(result);
                }
                try {
                  const response = JSON.parse(data);
                  if (response.id) {
                    result.id = response.id;
                  }
                  if ((_a2 = response.choices) == null ? void 0 : _a2.length) {
                    const delta = response.choices[0].delta;
                    result.delta = delta.content;
                    if (delta == null ? void 0 : delta.content)
                      result.text += delta.content;
                    if (delta.role) {
                      result.role = delta.role;
                    }
                    result.detail = response;
                    onProgress == null ? void 0 : onProgress(result);
                  }
                } catch (err) {
                  console.warn("OpenAI stream SEE event unexpected error", err);
                  return reject(err);
                }
              }
            },
            this._fetch
          ).catch(reject);
        } else {
          try {
            const res = await this._fetch(url, {
              method: "POST",
              headers,
              body: JSON.stringify(body),
              signal: abortSignal
            });
            if (!res.ok) {
              const reason = await res.text();
              const msg = `OpenAI error ${res.status || res.statusText}: ${reason}`;
              const error = new ChatGPTError(msg, { cause: res });
              error.statusCode = res.status;
              error.statusText = res.statusText;
              return reject(error);
            }
            const response = await res.json();
            if (this._debug) {
              console.log(response);
            }
            if (response == null ? void 0 : response.id) {
              result.id = response.id;
            }
            if ((_a = response == null ? void 0 : response.choices) == null ? void 0 : _a.length) {
              const message2 = response.choices[0].message;
              result.text = message2.content;
              if (message2.role) {
                result.role = message2.role;
              }
            } else {
              const res2 = response;
              return reject(
                new Error(
                  `OpenAI error: ${((_b = res2 == null ? void 0 : res2.detail) == null ? void 0 : _b.message) || (res2 == null ? void 0 : res2.detail) || "unknown"}`
                )
              );
            }
            result.detail = response;
            return resolve(result);
          } catch (err) {
            return reject(err);
          }
        }
      }
    ).then(async (message2) => {
      if (message2.detail && !message2.detail.usage) {
        try {
          const promptTokens = numTokens;
          const completionTokens = await this._getTokenCount(message2.text);
          message2.detail.usage = {
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: promptTokens + completionTokens,
            estimated: true
          };
        } catch (err) {
        }
      }
      return Promise.all([
        this._upsertMessage(latestQuestion),
        this._upsertMessage(message2)
      ]).then(() => message2);
    });
    if (timeoutMs) {
      if (abortController) {
        ;
        responseP.cancel = () => {
          abortController.abort();
        };
      }
      return pTimeout(responseP, {
        milliseconds: timeoutMs,
        message: "OpenAI timed out waiting for response"
      });
    } else {
      return responseP;
    }
  }
  get apiKey() {
    return this._apiKey;
  }
  set apiKey(apiKey) {
    this._apiKey = apiKey;
  }
  get apiOrg() {
    return this._apiOrg;
  }
  set apiOrg(apiOrg) {
    this._apiOrg = apiOrg;
  }
  async _buildMessages(text, opts) {
    const { systemMessage = this._systemMessage } = opts;
    let { parentMessageId } = opts;
    const userLabel = USER_LABEL_DEFAULT;
    const assistantLabel = ASSISTANT_LABEL_DEFAULT;
    const maxNumTokens = this._maxModelTokens - this._maxResponseTokens;
    let messages = [];
    if (systemMessage) {
      messages.push({
        role: "system",
        content: systemMessage
      });
    }
    const systemMessageOffset = messages.length;
    let nextMessages = text ? messages.concat([
      {
        role: "user",
        content: text,
        name: opts.name
      }
    ]) : messages;
    let numTokens = 0;
    do {
      const prompt = nextMessages.reduce((prompt2, message) => {
        switch (message.role) {
          case "system":
            return prompt2.concat([`Instructions:
${message.content}`]);
          case "user":
            return prompt2.concat([`${userLabel}:
${message.content}`]);
          default:
            return prompt2.concat([`${assistantLabel}:
${message.content}`]);
        }
      }, []).join("\n\n");
      const nextNumTokensEstimate = await this._getTokenCount(prompt);
      const isValidPrompt = nextNumTokensEstimate <= maxNumTokens;
      if (prompt && !isValidPrompt) {
        break;
      }
      messages = nextMessages;
      numTokens = nextNumTokensEstimate;
      if (!isValidPrompt) {
        break;
      }
      if (!parentMessageId) {
        break;
      }
      const parentMessage = await this._getMessageById(parentMessageId);
      if (!parentMessage) {
        break;
      }
      const parentMessageRole = parentMessage.role || "user";
      nextMessages = nextMessages.slice(0, systemMessageOffset).concat([
        {
          role: parentMessageRole,
          content: parentMessage.text,
          name: parentMessage.name
        },
        ...nextMessages.slice(systemMessageOffset)
      ]);
      parentMessageId = parentMessage.parentMessageId;
    } while (true);
    const maxTokens = Math.max(
      1,
      Math.min(this._maxModelTokens - numTokens, this._maxResponseTokens)
    );
    return { messages, maxTokens, numTokens };
  }
  async _getTokenCount(text) {
    text = text.replace(/<\|endoftext\|>/g, "");
    return encode(text).length;
  }
  async _defaultGetMessageById(id) {
    const res = await this._messageStore.get(id);
    return res;
  }
  async _defaultUpsertMessage(message) {
    await this._messageStore.set(message.id, message);
  }
};

// src/chatgpt-unofficial-proxy-api.ts



// src/utils.ts
var uuidv4Re = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isValidUUIDv4(str) {
  return str && uuidv4Re.test(str);
}

// src/chatgpt-unofficial-proxy-api.ts
var ChatGPTUnofficialProxyAPI = class {
  /**
   * @param fetch - Optional override for the `fetch` implementation to use. Defaults to the global `fetch` function.
   */
  constructor(opts) {
    const {
      accessToken,
      apiReverseProxyUrl = "https://bypass.duti.tech/api/conversation",
      model = "text-davinci-002-render-sha",
      debug = false,
      headers,
      fetch: fetch2 = fetch
    } = opts;
    this._accessToken = accessToken;
    this._apiReverseProxyUrl = apiReverseProxyUrl;
    this._debug = !!debug;
    this._model = model;
    this._fetch = fetch2;
    this._headers = headers;
    if (!this._accessToken) {
      throw new Error("ChatGPT invalid accessToken");
    }
    if (!this._fetch) {
      throw new Error("Invalid environment; fetch is not defined");
    }
    if (typeof this._fetch !== "function") {
      throw new Error('Invalid "fetch" is not a function');
    }
  }
  get accessToken() {
    return this._accessToken;
  }
  set accessToken(value) {
    this._accessToken = value;
  }
  /**
   * Sends a message to ChatGPT, waits for the response to resolve, and returns
   * the response.
   *
   * If you want your response to have historical context, you must provide a valid `parentMessageId`.
   *
   * If you want to receive a stream of partial responses, use `opts.onProgress`.
   * If you want to receive the full response, including message and conversation IDs,
   * you can use `opts.onConversationResponse` or use the `ChatGPTAPI.getConversation`
   * helper.
   *
   * Set `debug: true` in the `ChatGPTAPI` constructor to log more info on the full prompt sent to the OpenAI completions API. You can override the `promptPrefix` and `promptSuffix` in `opts` to customize the prompt.
   *
   * @param message - The prompt message to send
   * @param opts.conversationId - Optional ID of a conversation to continue (defaults to a random UUID)
   * @param opts.parentMessageId - Optional ID of the previous message in the conversation (defaults to `undefined`)
   * @param opts.messageId - Optional ID of the message to send (defaults to a random UUID)
   * @param opts.timeoutMs - Optional timeout in milliseconds (defaults to no timeout)
   * @param opts.onProgress - Optional callback which will be invoked every time the partial response is updated
   * @param opts.abortSignal - Optional callback used to abort the underlying `fetch` call using an [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
   *
   * @returns The response from ChatGPT
   */
  async sendMessage(text, opts = {}) {
    if (!!opts.conversationId !== !!opts.parentMessageId) {
      throw new Error(
        "ChatGPTUnofficialProxyAPI.sendMessage: conversationId and parentMessageId must both be set or both be undefined"
      );
    }
    if (opts.conversationId && !isValidUUIDv4(opts.conversationId)) {
      throw new Error(
        "ChatGPTUnofficialProxyAPI.sendMessage: conversationId is not a valid v4 UUID"
      );
    }
    if (opts.parentMessageId && !isValidUUIDv4(opts.parentMessageId)) {
      throw new Error(
        "ChatGPTUnofficialProxyAPI.sendMessage: parentMessageId is not a valid v4 UUID"
      );
    }
    if (opts.messageId && !isValidUUIDv4(opts.messageId)) {
      throw new Error(
        "ChatGPTUnofficialProxyAPI.sendMessage: messageId is not a valid v4 UUID"
      );
    }
    const {
      conversationId,
      parentMessageId = v4(),
      messageId = v4(),
      action = "next",
      timeoutMs,
      onProgress
    } = opts;
    let { abortSignal } = opts;
    let abortController = null;
    if (timeoutMs && !abortSignal) {
      abortController = new AbortController();
      abortSignal = abortController.signal;
    }
    const body = {
      action,
      messages: [
        {
          id: messageId,
          role: "user",
          content: {
            content_type: "text",
            parts: [text]
          }
        }
      ],
      model: this._model,
      parent_message_id: parentMessageId
    };
    if (conversationId) {
      body.conversation_id = conversationId;
    }
    const result = {
      role: "assistant",
      id: v4(),
      parentMessageId: messageId,
      conversationId,
      text: ""
    };
    const responseP = new Promise((resolve, reject) => {
      const url = this._apiReverseProxyUrl;
      const headers = {
        ...this._headers,
        Authorization: `Bearer ${this._accessToken}`,
        Accept: "text/event-stream",
        "Content-Type": "application/json"
      };
      if (this._debug) {
        console.log("POST", url, { body, headers });
      }
      fetchSSE(
        url,
        {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: abortSignal,
          onMessage: (data) => {
            var _a, _b, _c;
            if (data === "[DONE]") {
              return resolve(result);
            }
            try {
              const convoResponseEvent = JSON.parse(data);
              if (convoResponseEvent.conversation_id) {
                result.conversationId = convoResponseEvent.conversation_id;
              }
              if ((_a = convoResponseEvent.message) == null ? void 0 : _a.id) {
                result.id = convoResponseEvent.message.id;
              }
              const message = convoResponseEvent.message;
              if (message) {
                let text2 = (_c = (_b = message == null ? void 0 : message.content) == null ? void 0 : _b.parts) == null ? void 0 : _c[0];
                if (text2) {
                  result.text = text2;
                  if (onProgress) {
                    onProgress(result);
                  }
                }
              }
            } catch (err) {
              reject(err);
            }
          },
          onError: (err) => {
            reject(err);
          }
        },
        this._fetch
      ).catch((err) => {
        const errMessageL = err.toString().toLowerCase();
        if (result.text && (errMessageL === "error: typeerror: terminated" || errMessageL === "typeerror: terminated")) {
          return resolve(result);
        } else {
          return reject(err);
        }
      });
    });
    if (timeoutMs) {
      if (abortController) {
        ;
        responseP.cancel = () => {
          abortController.abort();
        };
      }
      return pTimeout(responseP, {
        milliseconds: timeoutMs,
        message: "ChatGPT timed out waiting for response"
      });
    } else {
      return responseP;
    }
  }
};

//# sourceMappingURL=index.js.map

/***/ }),

/***/ 6201:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
var __webpack_unused_export__;


__webpack_unused_export__ = ({
  value: true
});
Object.defineProperty(exports, "zR", ({
  enumerable: true,
  get: function () {
    return _nil.default;
  }
}));
Object.defineProperty(exports, "Qc", ({
  enumerable: true,
  get: function () {
    return _parse.default;
  }
}));
Object.defineProperty(exports, "Pz", ({
  enumerable: true,
  get: function () {
    return _stringify.default;
  }
}));
Object.defineProperty(exports, "v1", ({
  enumerable: true,
  get: function () {
    return _v.default;
  }
}));
Object.defineProperty(exports, "v3", ({
  enumerable: true,
  get: function () {
    return _v2.default;
  }
}));
Object.defineProperty(exports, "v4", ({
  enumerable: true,
  get: function () {
    return _v3.default;
  }
}));
Object.defineProperty(exports, "v5", ({
  enumerable: true,
  get: function () {
    return _v4.default;
  }
}));
Object.defineProperty(exports, "Gu", ({
  enumerable: true,
  get: function () {
    return _validate.default;
  }
}));
Object.defineProperty(exports, "i8", ({
  enumerable: true,
  get: function () {
    return _version.default;
  }
}));

var _v = _interopRequireDefault(__webpack_require__(1));

var _v2 = _interopRequireDefault(__webpack_require__(6632));

var _v3 = _interopRequireDefault(__webpack_require__(2881));

var _v4 = _interopRequireDefault(__webpack_require__(2307));

var _nil = _interopRequireDefault(__webpack_require__(3518));

var _version = _interopRequireDefault(__webpack_require__(1743));

var _validate = _interopRequireDefault(__webpack_require__(2558));

var _stringify = _interopRequireDefault(__webpack_require__(2201));

var _parse = _interopRequireDefault(__webpack_require__(490));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/***/ }),

/***/ 1107:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

var _crypto = _interopRequireDefault(__webpack_require__(6417));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function md5(bytes) {
  if (Array.isArray(bytes)) {
    bytes = Buffer.from(bytes);
  } else if (typeof bytes === 'string') {
    bytes = Buffer.from(bytes, 'utf8');
  }

  return _crypto.default.createHash('md5').update(bytes).digest();
}

var _default = md5;
exports.default = _default;

/***/ }),

/***/ 1381:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

var _crypto = _interopRequireDefault(__webpack_require__(6417));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = {
  randomUUID: _crypto.default.randomUUID
};
exports.default = _default;

/***/ }),

/***/ 3518:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;
var _default = '00000000-0000-0000-0000-000000000000';
exports.default = _default;

/***/ }),

/***/ 490:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

var _validate = _interopRequireDefault(__webpack_require__(2558));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function parse(uuid) {
  if (!(0, _validate.default)(uuid)) {
    throw TypeError('Invalid UUID');
  }

  let v;
  const arr = new Uint8Array(16); // Parse ########-....-....-....-............

  arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
  arr[1] = v >>> 16 & 0xff;
  arr[2] = v >>> 8 & 0xff;
  arr[3] = v & 0xff; // Parse ........-####-....-....-............

  arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
  arr[5] = v & 0xff; // Parse ........-....-####-....-............

  arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
  arr[7] = v & 0xff; // Parse ........-....-....-####-............

  arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
  arr[9] = v & 0xff; // Parse ........-....-....-....-############
  // (Use "/" to avoid 32-bit truncation when bit-shifting high-order bytes)

  arr[10] = (v = parseInt(uuid.slice(24, 36), 16)) / 0x10000000000 & 0xff;
  arr[11] = v / 0x100000000 & 0xff;
  arr[12] = v >>> 24 & 0xff;
  arr[13] = v >>> 16 & 0xff;
  arr[14] = v >>> 8 & 0xff;
  arr[15] = v & 0xff;
  return arr;
}

var _default = parse;
exports.default = _default;

/***/ }),

/***/ 1987:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;
var _default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
exports.default = _default;

/***/ }),

/***/ 548:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = rng;

var _crypto = _interopRequireDefault(__webpack_require__(6417));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const rnds8Pool = new Uint8Array(256); // # of random values to pre-allocate

let poolPtr = rnds8Pool.length;

function rng() {
  if (poolPtr > rnds8Pool.length - 16) {
    _crypto.default.randomFillSync(rnds8Pool);

    poolPtr = 0;
  }

  return rnds8Pool.slice(poolPtr, poolPtr += 16);
}

/***/ }),

/***/ 3203:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

var _crypto = _interopRequireDefault(__webpack_require__(6417));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function sha1(bytes) {
  if (Array.isArray(bytes)) {
    bytes = Buffer.from(bytes);
  } else if (typeof bytes === 'string') {
    bytes = Buffer.from(bytes, 'utf8');
  }

  return _crypto.default.createHash('sha1').update(bytes).digest();
}

var _default = sha1;
exports.default = _default;

/***/ }),

/***/ 2201:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;
exports.unsafeStringify = unsafeStringify;

var _validate = _interopRequireDefault(__webpack_require__(2558));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
const byteToHex = [];

for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).slice(1));
}

function unsafeStringify(arr, offset = 0) {
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}

function stringify(arr, offset = 0) {
  const uuid = unsafeStringify(arr, offset); // Consistency check for valid UUID.  If this throws, it's likely due to one
  // of the following:
  // - One or more input array values don't map to a hex octet (leading to
  // "undefined" in the uuid)
  // - Invalid input values for the RFC `version` or `variant` fields

  if (!(0, _validate.default)(uuid)) {
    throw TypeError('Stringified UUID is invalid');
  }

  return uuid;
}

var _default = stringify;
exports.default = _default;

/***/ }),

/***/ 1:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

var _rng = _interopRequireDefault(__webpack_require__(548));

var _stringify = __webpack_require__(2201);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html
let _nodeId;

let _clockseq; // Previous uuid creation time


let _lastMSecs = 0;
let _lastNSecs = 0; // See https://github.com/uuidjs/uuid for API details

function v1(options, buf, offset) {
  let i = buf && offset || 0;
  const b = buf || new Array(16);
  options = options || {};
  let node = options.node || _nodeId;
  let clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq; // node and clockseq need to be initialized to random values if they're not
  // specified.  We do this lazily to minimize issues related to insufficient
  // system entropy.  See #189

  if (node == null || clockseq == null) {
    const seedBytes = options.random || (options.rng || _rng.default)();

    if (node == null) {
      // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
      node = _nodeId = [seedBytes[0] | 0x01, seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
    }

    if (clockseq == null) {
      // Per 4.2.2, randomize (14 bit) clockseq
      clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
    }
  } // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.


  let msecs = options.msecs !== undefined ? options.msecs : Date.now(); // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock

  let nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1; // Time since last uuid creation (in msecs)

  const dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 10000; // Per 4.2.1.2, Bump clockseq on clock regression

  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  } // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval


  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  } // Per 4.2.1.2 Throw error if too many uuids are requested


  if (nsecs >= 10000) {
    throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq; // Per 4.1.4 - Convert from unix epoch to Gregorian epoch

  msecs += 12219292800000; // `time_low`

  const tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff; // `time_mid`

  const tmh = msecs / 0x100000000 * 10000 & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff; // `time_high_and_version`

  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version

  b[i++] = tmh >>> 16 & 0xff; // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)

  b[i++] = clockseq >>> 8 | 0x80; // `clock_seq_low`

  b[i++] = clockseq & 0xff; // `node`

  for (let n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }

  return buf || (0, _stringify.unsafeStringify)(b);
}

var _default = v1;
exports.default = _default;

/***/ }),

/***/ 6632:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

var _v = _interopRequireDefault(__webpack_require__(2829));

var _md = _interopRequireDefault(__webpack_require__(1107));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const v3 = (0, _v.default)('v3', 0x30, _md.default);
var _default = v3;
exports.default = _default;

/***/ }),

/***/ 2829:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.URL = exports.DNS = void 0;
exports.default = v35;

var _stringify = __webpack_require__(2201);

var _parse = _interopRequireDefault(__webpack_require__(490));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function stringToBytes(str) {
  str = unescape(encodeURIComponent(str)); // UTF8 escape

  const bytes = [];

  for (let i = 0; i < str.length; ++i) {
    bytes.push(str.charCodeAt(i));
  }

  return bytes;
}

const DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
exports.DNS = DNS;
const URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
exports.URL = URL;

function v35(name, version, hashfunc) {
  function generateUUID(value, namespace, buf, offset) {
    var _namespace;

    if (typeof value === 'string') {
      value = stringToBytes(value);
    }

    if (typeof namespace === 'string') {
      namespace = (0, _parse.default)(namespace);
    }

    if (((_namespace = namespace) === null || _namespace === void 0 ? void 0 : _namespace.length) !== 16) {
      throw TypeError('Namespace must be array-like (16 iterable integer values, 0-255)');
    } // Compute hash of namespace and value, Per 4.3
    // Future: Use spread syntax when supported on all platforms, e.g. `bytes =
    // hashfunc([...namespace, ... value])`


    let bytes = new Uint8Array(16 + value.length);
    bytes.set(namespace);
    bytes.set(value, namespace.length);
    bytes = hashfunc(bytes);
    bytes[6] = bytes[6] & 0x0f | version;
    bytes[8] = bytes[8] & 0x3f | 0x80;

    if (buf) {
      offset = offset || 0;

      for (let i = 0; i < 16; ++i) {
        buf[offset + i] = bytes[i];
      }

      return buf;
    }

    return (0, _stringify.unsafeStringify)(bytes);
  } // Function#name is not settable on some platforms (#270)


  try {
    generateUUID.name = name; // eslint-disable-next-line no-empty
  } catch (err) {} // For CommonJS default export support


  generateUUID.DNS = DNS;
  generateUUID.URL = URL;
  return generateUUID;
}

/***/ }),

/***/ 2881:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

var _native = _interopRequireDefault(__webpack_require__(1381));

var _rng = _interopRequireDefault(__webpack_require__(548));

var _stringify = __webpack_require__(2201);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function v4(options, buf, offset) {
  if (_native.default.randomUUID && !buf && !options) {
    return _native.default.randomUUID();
  }

  options = options || {};

  const rnds = options.random || (options.rng || _rng.default)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`


  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

  if (buf) {
    offset = offset || 0;

    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }

    return buf;
  }

  return (0, _stringify.unsafeStringify)(rnds);
}

var _default = v4;
exports.default = _default;

/***/ }),

/***/ 2307:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

var _v = _interopRequireDefault(__webpack_require__(2829));

var _sha = _interopRequireDefault(__webpack_require__(3203));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const v5 = (0, _v.default)('v5', 0x50, _sha.default);
var _default = v5;
exports.default = _default;

/***/ }),

/***/ 2558:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

var _regex = _interopRequireDefault(__webpack_require__(1987));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function validate(uuid) {
  return typeof uuid === 'string' && _regex.default.test(uuid);
}

var _default = validate;
exports.default = _default;

/***/ }),

/***/ 1743:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

var _validate = _interopRequireDefault(__webpack_require__(2558));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function version(uuid) {
  if (!(0, _validate.default)(uuid)) {
    throw TypeError('Invalid UUID');
  }

  return parseInt(uuid.slice(14, 15), 16);
}

var _default = version;
exports.default = _default;

/***/ }),

/***/ 2820:
/***/ ((__unused_webpack_module, exports) => {

//TODO: handle reviver/dehydrate function like normal
//and handle indentation, like normal.
//if anyone needs this... please send pull request.

exports.stringify = function stringify (o) {
  if('undefined' == typeof o) return o

  if(o && Buffer.isBuffer(o))
    return JSON.stringify(':base64:' + o.toString('base64'))

  if(o && o.toJSON)
    o =  o.toJSON()

  if(o && 'object' === typeof o) {
    var s = ''
    var array = Array.isArray(o)
    s = array ? '[' : '{'
    var first = true

    for(var k in o) {
      var ignore = 'function' == typeof o[k] || (!array && 'undefined' === typeof o[k])
      if(Object.hasOwnProperty.call(o, k) && !ignore) {
        if(!first)
          s += ','
        first = false
        if (array) {
          if(o[k] == undefined)
            s += 'null'
          else
            s += stringify(o[k])
        } else if (o[k] !== void(0)) {
          s += stringify(k) + ':' + stringify(o[k])
        }
      }
    }

    s += array ? ']' : '}'

    return s
  } else if ('string' === typeof o) {
    return JSON.stringify(/^:/.test(o) ? ':' + o : o)
  } else if ('undefined' === typeof o) {
    return 'null';
  } else
    return JSON.stringify(o)
}

exports.parse = function (s) {
  return JSON.parse(s, function (key, value) {
    if('string' === typeof value) {
      if(/^:base64:/.test(value))
        return Buffer.from(value.substring(8), 'base64')
      else
        return /^:/.test(value) ? value.substring(1) : value 
    }
    return value
  })
}


/***/ }),

/***/ 1531:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const EventEmitter = __webpack_require__(8614);
const JSONB = __webpack_require__(2820);

const loadStore = options => {
	const adapters = {
		redis: '@keyv/redis',
		rediss: '@keyv/redis',
		mongodb: '@keyv/mongo',
		mongo: '@keyv/mongo',
		sqlite: '@keyv/sqlite',
		postgresql: '@keyv/postgres',
		postgres: '@keyv/postgres',
		mysql: '@keyv/mysql',
		etcd: '@keyv/etcd',
		offline: '@keyv/offline',
		tiered: '@keyv/tiered',
	};
	if (options.adapter || options.uri) {
		const adapter = options.adapter || /^[^:+]*/.exec(options.uri)[0];
		return new (require(adapters[adapter]))(options);
	}

	return new Map();
};

const iterableAdapters = [
	'sqlite',
	'postgres',
	'mysql',
	'mongo',
	'redis',
	'tiered',
];

class Keyv extends EventEmitter {
	constructor(uri, {emitErrors = true, ...options} = {}) {
		super();
		this.opts = {
			namespace: 'keyv',
			serialize: JSONB.stringify,
			deserialize: JSONB.parse,
			...((typeof uri === 'string') ? {uri} : uri),
			...options,
		};

		if (!this.opts.store) {
			const adapterOptions = {...this.opts};
			this.opts.store = loadStore(adapterOptions);
		}

		if (this.opts.compression) {
			const compression = this.opts.compression;
			this.opts.serialize = compression.serialize.bind(compression);
			this.opts.deserialize = compression.deserialize.bind(compression);
		}

		if (typeof this.opts.store.on === 'function' && emitErrors) {
			this.opts.store.on('error', error => this.emit('error', error));
		}

		this.opts.store.namespace = this.opts.namespace;

		const generateIterator = iterator => async function * () {
			for await (const [key, raw] of typeof iterator === 'function'
				? iterator(this.opts.store.namespace)
				: iterator) {
				const data = this.opts.deserialize(raw);
				if (this.opts.store.namespace && !key.includes(this.opts.store.namespace)) {
					continue;
				}

				if (typeof data.expires === 'number' && Date.now() > data.expires) {
					this.delete(key);
					continue;
				}

				yield [this._getKeyUnprefix(key), data.value];
			}
		};

		// Attach iterators
		if (typeof this.opts.store[Symbol.iterator] === 'function' && this.opts.store instanceof Map) {
			this.iterator = generateIterator(this.opts.store);
		} else if (typeof this.opts.store.iterator === 'function' && this.opts.store.opts
			&& this._checkIterableAdaptar()) {
			this.iterator = generateIterator(this.opts.store.iterator.bind(this.opts.store));
		}
	}

	_checkIterableAdaptar() {
		return iterableAdapters.includes(this.opts.store.opts.dialect)
			|| iterableAdapters.findIndex(element => this.opts.store.opts.url.includes(element)) >= 0;
	}

	_getKeyPrefix(key) {
		return `${this.opts.namespace}:${key}`;
	}

	_getKeyPrefixArray(keys) {
		return keys.map(key => `${this.opts.namespace}:${key}`);
	}

	_getKeyUnprefix(key) {
		return key
			.split(':')
			.splice(1)
			.join(':');
	}

	get(key, options) {
		const {store} = this.opts;
		const isArray = Array.isArray(key);
		const keyPrefixed = isArray ? this._getKeyPrefixArray(key) : this._getKeyPrefix(key);
		if (isArray && store.getMany === undefined) {
			const promises = [];
			for (const key of keyPrefixed) {
				promises.push(Promise.resolve()
					.then(() => store.get(key))
					.then(data => (typeof data === 'string') ? this.opts.deserialize(data) : (this.opts.compression ? this.opts.deserialize(data) : data))
					.then(data => {
						if (data === undefined || data === null) {
							return undefined;
						}

						if (typeof data.expires === 'number' && Date.now() > data.expires) {
							return this.delete(key).then(() => undefined);
						}

						return (options && options.raw) ? data : data.value;
					}),
				);
			}

			return Promise.allSettled(promises)
				.then(values => {
					const data = [];
					for (const value of values) {
						data.push(value.value);
					}

					return data;
				});
		}

		return Promise.resolve()
			.then(() => isArray ? store.getMany(keyPrefixed) : store.get(keyPrefixed))
			.then(data => (typeof data === 'string') ? this.opts.deserialize(data) : (this.opts.compression ? this.opts.deserialize(data) : data))
			.then(data => {
				if (data === undefined || data === null) {
					return undefined;
				}

				if (isArray) {
					const result = [];

					for (let row of data) {
						if ((typeof row === 'string')) {
							row = this.opts.deserialize(row);
						}

						if (row === undefined || row === null) {
							result.push(undefined);
							continue;
						}

						if (typeof row.expires === 'number' && Date.now() > row.expires) {
							this.delete(key).then(() => undefined);
							result.push(undefined);
						} else {
							result.push((options && options.raw) ? row : row.value);
						}
					}

					return result;
				}

				if (typeof data.expires === 'number' && Date.now() > data.expires) {
					return this.delete(key).then(() => undefined);
				}

				return (options && options.raw) ? data : data.value;
			});
	}

	set(key, value, ttl) {
		const keyPrefixed = this._getKeyPrefix(key);
		if (typeof ttl === 'undefined') {
			ttl = this.opts.ttl;
		}

		if (ttl === 0) {
			ttl = undefined;
		}

		const {store} = this.opts;

		return Promise.resolve()
			.then(() => {
				const expires = (typeof ttl === 'number') ? (Date.now() + ttl) : null;
				if (typeof value === 'symbol') {
					this.emit('error', 'symbol cannot be serialized');
				}

				value = {value, expires};
				return this.opts.serialize(value);
			})
			.then(value => store.set(keyPrefixed, value, ttl))
			.then(() => true);
	}

	delete(key) {
		const {store} = this.opts;
		if (Array.isArray(key)) {
			const keyPrefixed = this._getKeyPrefixArray(key);
			if (store.deleteMany === undefined) {
				const promises = [];
				for (const key of keyPrefixed) {
					promises.push(store.delete(key));
				}

				return Promise.allSettled(promises)
					.then(values => values.every(x => x.value === true));
			}

			return Promise.resolve()
				.then(() => store.deleteMany(keyPrefixed));
		}

		const keyPrefixed = this._getKeyPrefix(key);
		return Promise.resolve()
			.then(() => store.delete(keyPrefixed));
	}

	clear() {
		const {store} = this.opts;
		return Promise.resolve()
			.then(() => store.clear());
	}

	has(key) {
		const keyPrefixed = this._getKeyPrefix(key);
		const {store} = this.opts;
		return Promise.resolve()
			.then(async () => {
				if (typeof store.has === 'function') {
					return store.has(keyPrefixed);
				}

				const value = await store.get(keyPrefixed);
				return value !== undefined;
			});
	}

	disconnect() {
		const {store} = this.opts;
		if (typeof store.disconnect === 'function') {
			return store.disconnect();
		}
	}
}

module.exports = Keyv;


/***/ }),

/***/ 9014:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var __webpack_unused_export__;
const wasm = __webpack_require__(9043);
let imports = {};
imports["./tiktoken_bg.js"] = wasm;
const path = __webpack_require__(5622);
const fs = __webpack_require__(5747);

const candidates = __dirname
  .split(path.sep)
  .reduce((memo, _, index, array) => {
    const prefix = array.slice(0, index + 1).join(path.sep) + path.sep;
    if (!prefix.includes("node_modules" + path.sep)) {
      memo.unshift(
        path.join(
          prefix,
          "node_modules",
          "@dqbd",
          "tiktoken",
          "",
          "./tiktoken_bg.wasm"
        )
      );
    }
    return memo;
  }, [])
candidates.unshift(path.join(__dirname, "./tiktoken_bg.wasm"));

let bytes = null;
for (const candidate of candidates) {
  try {
    bytes = fs.readFileSync(candidate);
    break;
  } catch {}
}

if (bytes == null) throw new Error("Missing tiktoken_bg.wasm");
const wasmModule = new WebAssembly.Module(bytes);
const wasmInstance = new WebAssembly.Instance(wasmModule, imports);
wasm.__wbg_set_wasm(wasmInstance.exports);
exports.iw = wasm["get_encoding"];
__webpack_unused_export__ = wasm["encoding_for_model"];
__webpack_unused_export__ = wasm["Tiktoken"];

/***/ }),

/***/ 9043:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* module decorator */ module = __webpack_require__.nmd(module);
let wasm;
module.exports.__wbg_set_wasm = function(val) {
    wasm = val;
};
const heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

let WASM_VECTOR_LEN = 0;

let cachedUint8Memory0 = null;

function getUint8Memory0() {
    if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len);

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachedInt32Memory0 = null;

function getInt32Memory0() {
    if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

let cachedUint32Memory0 = null;

function getUint32Memory0() {
    if (cachedUint32Memory0 === null || cachedUint32Memory0.byteLength === 0) {
        cachedUint32Memory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32Memory0;
}

function getArrayU32FromWasm0(ptr, len) {
    return getUint32Memory0().subarray(ptr / 4, ptr / 4 + len);
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1);
    getUint8Memory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArray32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4);
    getUint32Memory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function getArrayU8FromWasm0(ptr, len) {
    return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}
module.exports.get_encoding = function(encoding, extend_special_tokens) {
    if (wasm == null) throw new Error("@dqbd/tiktoken: WASM binary has not been propery initialized.");
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(encoding, wasm.__wbindgen_export_0, wasm.__wbindgen_export_1);
        const len0 = WASM_VECTOR_LEN;
        wasm.get_encoding(retptr, ptr0, len0, addHeapObject(extend_special_tokens));
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var r2 = getInt32Memory0()[retptr / 4 + 2];
        if (r2) {
            throw takeObject(r1);
        }
        return Tiktoken.__wrap(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
};
module.exports.encoding_for_model = function(model, extend_special_tokens) {
    if (wasm == null) throw new Error("@dqbd/tiktoken: WASM binary has not been propery initialized.");
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(model, wasm.__wbindgen_export_0, wasm.__wbindgen_export_1);
        const len0 = WASM_VECTOR_LEN;
        wasm.encoding_for_model(retptr, ptr0, len0, addHeapObject(extend_special_tokens));
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var r2 = getInt32Memory0()[retptr / 4 + 2];
        if (r2) {
            throw takeObject(r1);
        }
        return Tiktoken.__wrap(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
};

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_export_3(addHeapObject(e));
    }
}
/** */
class Tiktoken {
    /**
     * @param {string} tiktoken_bfe
     * @param {any} special_tokens
     * @param {string} pat_str
     */
    constructor(tiktoken_bfe, special_tokens, pat_str) {
        if (wasm == null) throw new Error("@dqbd/tiktoken: WASM binary has not been propery initialized.");
        const ptr0 = passStringToWasm0(tiktoken_bfe, wasm.__wbindgen_export_0, wasm.__wbindgen_export_1);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(pat_str, wasm.__wbindgen_export_0, wasm.__wbindgen_export_1);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.tiktoken_new(ptr0, len0, addHeapObject(special_tokens), ptr1, len1);
        return Tiktoken.__wrap(ret);
    }

    /** @returns {string | undefined} */
    get name() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.tiktoken_name(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            let v0;
            if (r0 !== 0) {
                v0 = getStringFromWasm0(r0, r1).slice();
                wasm.__wbindgen_export_2(r0, r1 * 1);
            }
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }

    static __wrap(ptr) {
        const obj = Object.create(Tiktoken.prototype);
        obj.ptr = ptr;
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;
        return ptr;
    }

    free() {
        if (wasm == null) throw new Error("@dqbd/tiktoken: WASM binary has not been propery initialized.");
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_tiktoken_free(ptr);
    }

    /**
     * @param {string} text
     * @param {any} allowed_special
     * @param {any} disallowed_special
     * @returns {Uint32Array}
     */
    encode(text, allowed_special, disallowed_special) {
        if (wasm == null) throw new Error("@dqbd/tiktoken: WASM binary has not been propery initialized.");
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(text, wasm.__wbindgen_export_0, wasm.__wbindgen_export_1);
            const len0 = WASM_VECTOR_LEN;
            wasm.tiktoken_encode(retptr, this.ptr, ptr0, len0, addHeapObject(allowed_special), addHeapObject(disallowed_special));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v1 = getArrayU32FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_2(r0, r1 * 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }

    /**
     * @param {string} text
     * @returns {Uint32Array}
     */
    encode_ordinary(text) {
        if (wasm == null) throw new Error("@dqbd/tiktoken: WASM binary has not been propery initialized.");
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(text, wasm.__wbindgen_export_0, wasm.__wbindgen_export_1);
            const len0 = WASM_VECTOR_LEN;
            wasm.tiktoken_encode_ordinary(retptr, this.ptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v1 = getArrayU32FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_2(r0, r1 * 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }

    /**
     * @param {string} text
     * @param {any} allowed_special
     * @param {any} disallowed_special
     * @returns {any}
     */
    encode_with_unstable(text, allowed_special, disallowed_special) {
        if (wasm == null) throw new Error("@dqbd/tiktoken: WASM binary has not been propery initialized.");
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(text, wasm.__wbindgen_export_0, wasm.__wbindgen_export_1);
            const len0 = WASM_VECTOR_LEN;
            wasm.tiktoken_encode_with_unstable(retptr, this.ptr, ptr0, len0, addHeapObject(allowed_special), addHeapObject(disallowed_special));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {number}
     */
    encode_single_token(bytes) {
        if (wasm == null) throw new Error("@dqbd/tiktoken: WASM binary has not been propery initialized.");
        const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_export_0);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.tiktoken_encode_single_token(this.ptr, ptr0, len0);
        return ret >>> 0;
    }

    /**
     * @param {Uint32Array} tokens
     * @returns {Uint8Array}
     */
    decode(tokens) {
        if (wasm == null) throw new Error("@dqbd/tiktoken: WASM binary has not been propery initialized.");
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray32ToWasm0(tokens, wasm.__wbindgen_export_0);
            const len0 = WASM_VECTOR_LEN;
            wasm.tiktoken_decode(retptr, this.ptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_2(r0, r1 * 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }

    /**
     * @param {number} token
     * @returns {Uint8Array}
     */
    decode_single_token_bytes(token) {
        if (wasm == null) throw new Error("@dqbd/tiktoken: WASM binary has not been propery initialized.");
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.tiktoken_decode_single_token_bytes(retptr, this.ptr, token);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_2(r0, r1 * 1);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }

    /** @returns {any} */
    token_byte_values() {
        if (wasm == null) throw new Error("@dqbd/tiktoken: WASM binary has not been propery initialized.");
        const ret = wasm.tiktoken_token_byte_values(this.ptr);
        return takeObject(ret);
    }
}
module.exports.Tiktoken = Tiktoken;
module.exports.__wbindgen_object_drop_ref = function(arg0) {
    takeObject(arg0);
};
;
module.exports.__wbindgen_is_undefined = function(arg0) {
    const ret = getObject(arg0) === undefined;
    return ret;
};
;
module.exports.__wbg_stringify_029a979dfb73aa17 = function() {
    return handleError(function (arg0) {
        const ret = JSON.stringify(getObject(arg0));
        return addHeapObject(ret);
    }, arguments) };
;
module.exports.__wbindgen_string_get = function(arg0, arg1) {
    if (wasm == null) throw new Error("@dqbd/tiktoken: WASM binary has not been propery initialized.");
    const obj = getObject(arg1);
    const ret = typeof(obj) === 'string' ? obj : undefined;
    var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_export_0, wasm.__wbindgen_export_1);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};
;
module.exports.__wbindgen_error_new = function(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};
;
module.exports.__wbg_parse_3ac95b51fc312db8 = function() {
    return handleError(function (arg0, arg1) {
        const ret = JSON.parse(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    }, arguments) };
;
module.exports.__wbindgen_throw = function(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};
;



/***/ })

};
;
//# sourceMappingURL=306.index.js.map