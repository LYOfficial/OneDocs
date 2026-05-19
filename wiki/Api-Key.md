# 🔑 API Key 获取

OneDocs 需要配置 AI 模型的 API Key 才能使用分析功能。本文介绍各大模型供应商的 API Key 获取方法。

> 💡 如果你不想购买 API Key，可以使用 OneDocs 内置的免费模型，无需任何配置。详见 [模型配置](Model-Configuration)。

---

## OpenAI

> [!TIP]
> OpenAI 官网访问需要外网环境，若要调用 API 需要充值，请确保自己账户有剩余额度再进行下一步操作。若不符合要求，请尝试使用其他 API。

1. 进入 [OpenAI API 平台](https://platform.openai.com/api-keys)
2. 登录后，点击 `Create new secret key`
3. 设置好 `Name` 后新建 KEY
4. 将新建的 KEY 复制到 OneDocs 软件内
5. 选择模型库为 `OpenAI`，推荐使用 `GPT-4o` 作为首选模型

![](https://img.1n.hk/f/2025/10/13/68ed0d6d6950c.png)

![](https://img.1n.hk/f/2025/10/13/68ed0e26ab6ed.png)

![](https://img.1n.hk/f/2025/10/13/68ed0e415e664.png)

![](https://img.1n.hk/f/2025/10/13/68ed0e50966e0.png)

---

## DeepSeek

> [!TIP]
> DeepSeek API 为国内环境，若要调用 API 需要充值，请确保自己账户有剩余额度再进行下一步操作。若不符合要求，请尝试使用其他 API。

1. 进入 [DeepSeek 开放平台](https://platform.deepseek.com/usage)
2. 登录后，点击 `创建 API key`
3. 设置好 `名称` 后新建 KEY
4. 将新建的 KEY 复制到 OneDocs 软件内
5. 选择模型库为 `DeepSeek`，推荐使用 `DeepSeek-Reasoner` 作为首选模型

![](https://img.1n.hk/f/2025/10/13/68ed10e699589.png)

![](https://img.1n.hk/f/2025/10/13/68ed10ede42fe.png)

![](https://img.1n.hk/f/2025/10/13/68ed10f32dd8c.png)

![](https://img.1n.hk/f/2025/10/13/68ed1149cddbc.png)

---

## 智谱 GLM

> [!TIP]
> 智谱 GLM API 为国内环境，大部分 API 调用需要充值，但也有 GLM-4-Flash 这样的免费模型可以调用（且账户无需充值），请确保自己账户有剩余额度再进行下一步操作。若不符合要求，请尝试使用其他 API。

1. 进入 [智谱AI开放平台](https://bigmodel.cn/usercenter/proj-mgmt/apikeys)
2. 登录后，点击 `添加新的 API key`
3. 设置好 `API Key 名称` 后新建 KEY
4. 将新建的 KEY 复制到 OneDocs 软件内
5. 选择模型库为 `智谱 GLM`
6. 推荐使用 `GLM-4` 作为首选模型，若账户无额度，推荐使用 `GLM-4-Flash` 作为首选模型

![](https://img.1n.hk/f/2025/10/13/68ed14980fd02.png)

![](https://img.1n.hk/f/2025/10/13/68ed14a96791f.png)

![](https://img.1n.hk/f/2025/10/13/68ed14ae4b9b3.png)

![](https://img.1n.hk/f/2025/10/13/68ed14b51755c.png)

---

## Google Gemini

1. 进入 [Google AI Studio](https://aistudio.google.com/apikey)
2. 登录 Google 账号
3. 点击 `Create API Key`
4. 复制生成的 API Key
5. 在 OneDocs 中选择模型库为 `Gemini`

> ⚠️ Google Gemini API 需要外网环境访问。

---

## Moonshot（月之暗面）

1. 进入 [Moonshot 开放平台](https://platform.moonshot.cn/console/api-keys)
2. 注册/登录账号
3. 点击 `创建新的 API Key`
4. 复制 API Key 到 OneDocs
5. 选择模型库为 `Moonshot`

---

## 硅基流动（SiliconFlow）

1. 进入 [SiliconFlow](https://cloud.siliconflow.cn)
2. 注册账号（[通过此链接注册可获赠免费额度](https://cloud.siliconflow.cn/i/AOugEVKt)）
3. 在控制台获取 API Key
4. 在 OneDocs 中选择模型库为 `硅基流动`

> 💡 硅基流动提供部分免费模型，适合预算有限的用户。

---

## OpenRouter

1. 进入 [OpenRouter](https://openrouter.ai/keys)
2. 注册/登录账号
3. 点击 `Create Key`
4. 复制 API Key 到 OneDocs
5. 选择模型库为 `OpenRouter`

> 💡 OpenRouter 聚合了多种模型，可以用一个 API Key 访问多个供应商的模型。

---

## 在 OneDocs 中配置 API Key

获取到 API Key 后，在 OneDocs 中配置：

1. 点击顶部导航栏「**设置**」
2. 左侧选择「**模型**」
3. 选择对应的供应商
4. 在 `API Key` 输入框中粘贴你的 Key
5. 选择要使用的模型
6. 点击「**保存**」

> ⚠️ API Key 仅保存在本地，不会上传到任何服务器。
