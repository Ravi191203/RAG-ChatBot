# Contextual Companion: Your AI-Powered RAG Chatbot

![Contextual Companion Screenshot](https://github.com/Ravi191203/RAG-ChatBot/blob/2eeb51cf8287adc783da396bb7c5266a5eba26bf/Screenshot%202025-07-24%20223415.png)

**Contextual Companion** is an intelligent, full-stack web application that leverages Retrieval-Augmented Generation (RAG) to answer questions about any document you provide. Simply upload a file or paste text, and our AI-powered assistant will extract the key knowledge and engage in a contextual conversation with you.

This project was built to demonstrate the power of combining modern web technologies like Next.js with advanced AI capabilities from Google's Gemini models through the Genkit framework.

## ✨ Key Features

- **Dynamic Knowledge Base:** Upload `.txt` or `.md` files, or paste raw text to create a contextual knowledge base on the fly.
- **Intelligent Knowledge Extraction:** An AI agent analyzes the provided content and synthesizes a comprehensive summary.
- **Persistent Knowledge:** Save your extracted knowledge to a MongoDB database to reuse across sessions.
- **Conversational Chat Interface:** Ask questions in natural language and receive context-aware answers based on the document.
- **Session-Based Chat History:** Conversations are maintained during a browser session.
- **Responsive Design:** A clean, modern UI that works seamlessly across desktop and mobile devices.
- **Dark & Light Modes:** Switch between themes for your viewing comfort.
- **Code-Friendly:** Displays code snippets with syntax highlighting and a one-click copy button.

## 🚀 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **AI & Generative AI:** [Genkit](https://firebase.google.com/docs/genkit) with [Google's Gemini API](https://ai.google.dev/)
- **Database:** [MongoDB](https://www.mongodb.com/) for persistent knowledge storage.
- **UI:** [React](https://react.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Component Library:** [ShadCN UI](https://ui.shadcn.com/)
- **Containerization:** [Docker](https://www.docker.com/)
- **Deployment:** Ready for [Firebase App Hosting](https://firebase.google.com/docs/hosting)

## 🛠️ Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/en) (v18 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A [Google AI API Key](https://ai.google.dev/gemini-api/docs/api-key) for Gemini.
- A [MongoDB connection string URI](https://www.mongodb.com/docs/manual/reference/connection-string/).

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/contextual-companion.git
    cd contextual-companion
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the following variables. Replace the placeholder values with your actual keys.

    ```env
    # Your Google AI API Key for Gemini
    GEMINI_API_KEY="your-gemini-api-key"

    # Your MongoDB Connection String
    MONGODB_URI="your-mongodb-connection-string"
    ```

### Running the Application

1.  **Start the development server:**
    ```bash
    npm run dev
    ```

2.  **Open your browser:**
    Navigate to [http://localhost:3000](http://localhost:3000) to see the application in action.

## 🐳 Running with Docker

For easy and consistent deployment, you can run this application inside a Docker container.

1.  **Build the Docker image:**
    From the root directory of the project, run the following command. This will build the image and tag it as `contextual-companion`.
    ```bash
    docker build -t contextual-companion .
    ```

2.  **Run the Docker container:**
    Once the image is built, run the following command. This will start the container, pass your local `.env` file to it, and map port `3000` from the container to your local machine.
    ```bash
    docker run --env-file .env -p 3000:3000 contextual-companion
    ```
    
    _**Note:** Ensure your `.env` file in the project root is populated with the `GEMINI_API_KEY` and `MONGODB_URI` before running this command._

3.  **Access the application:**
    You can now access the running application in your browser at [http://localhost:3000](http://localhost:3000).

## 🤖 AI & Genkit

This project uses **Genkit**, an open-source framework from Google, to streamline the development of AI-powered features.

- **`knowledge-extraction.ts`:** This flow defines an AI agent that takes raw text content as input and extracts a structured, comprehensive summary.
- **`intelligent-responses.ts`:** This flow powers the chat functionality. It uses the extracted knowledge and chat history as context to provide relevant and accurate answers to user questions, falling back on its general knowledge when the context is insufficient.

The prompts are designed to be robust, with retry logic and fallback models to ensure a reliable user experience.
