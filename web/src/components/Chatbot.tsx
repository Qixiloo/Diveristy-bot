import { useEffect, useRef, useState } from "react";
import { Avatar, Box, Container, Paper, TextField, Typography } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CircularProgress from "@mui/material/CircularProgress";
import { LoadingButton } from "@mui/lab";
import useNotification from "../hooks/useNotification";

const fontstyle = {
    fontFamily: "Gill Sans, sans-serif",
    fontSize: "18",
    whiteSpace: "pre-line",
    textAlign: "left",
};
export interface ChatMessage {
    type: "human" | "ai";
    text: string;
    image_urls?: string[];
    image_url?: string;
}

export interface ChatMessageProps {
    message: ChatMessage;
}

const path = import.meta.env.VITE_API_URL;

const isProduction = import.meta.env.MODE === "production";
const apiRootPath = isProduction ? path : "/api";
console.log("apiRootPath", apiRootPath);

export function Chatbot() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendNotification = useNotification();

    useEffect(() => {
        if (error) {
            sendNotification({ msg: error, variant: "error" });
        }
    }, [error, sendNotification]);

    useEffect(() => {
        const fetchChatHistory = async () => {
            try {
                const response = await fetch(`${apiRootPath}/chat`);
                console.log("test test test response", response);
                const data = await response.json();
                setMessages(data.response.messages);
            } catch (error) {
                console.error("Error fetching chat history:", error);
                setError("An error occurred while fetching chat history.");
            }
        };

        fetchChatHistory();
        // fetchContextFile();
    }, []);

    // useEffect(() => {
    //     fetchContextFile();
    // }, [messages]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setInputValue(value);
    };

    const handleSendMessage = async () => {
        const trimmedInput = inputValue.trim();
        if (trimmedInput) {
            try {
                setMessages([
                    ...messages,
                    {
                        type: "human",
                        text: trimmedInput,
                    },
                ]);
                setLoading(true);

                const formData = new FormData();
                formData.append("question", trimmedInput);

                const requestOptions = {
                    method: "POST",
                    body: formData, // FormData will set the Content-Type to 'multipart/form-data' automatically
                };

                const response = await fetch(`${apiRootPath}/chat`, requestOptions);
                const data = await response.json();

                if (data && data.response) {
                    setMessages((prevMessages) => [
                        ...prevMessages,
                        {
                            type: "ai",
                            text: data.response,
                        },
                    ]);
                }
            } catch (error) {
                console.error("Error sending message:", error);
                setError("An error occurred while sending the message.");
            } finally {
                setLoading(false);
                setInputValue("");
            }
        }
    };

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView();
        }
    }, [messages]);

    return (
        <Container
            maxWidth="xl"
            component="div"
            sx={{ minHeight: "100vh", pl: "0", pr: "0" }}
        >
            <Paper
                elevation={3}
                sx={{
                    padding: "20px",
                    maxHeight: "85vh",
                    overflowY: "auto",
                    minHeight: "85vh",
                }}
            >
                {messages.map((message, index) => (
                    <>
                        <ChatMessage key={index} message={message} />
                    </>
                ))}
                <div ref={messagesEndRef} />

                {loading && (
                    <Box sx={{ display: "flex" }}>
                        <CircularProgress />
                        <Typography variant="body1">Loading Response...</Typography>
                    </Box>
                )}
            </Paper>

            <Box sx={{ display: "flex", marginTop: "10px", gap: "10px" }}>
                <TextField
                    disabled={loading}
                    fullWidth
                    multiline
                    label="Type your message"
                    variant="outlined"
                    value={inputValue}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    onChange={handleInputChange}
                />

                <LoadingButton
                    loading={loading}
                    disabled={!inputValue || loading}
                    variant="contained"
                    color="primary"
                    onClick={handleSendMessage}
                >
                    <SendIcon />
                </LoadingButton>
            </Box>
        </Container>
    );
}

export default Chatbot;

const ChatMessage = ({ message }: ChatMessageProps) => {
    const isAIMessage = message.type === "ai";
    const senderName = isAIMessage ? "Emily" : "You";
    const avatarSrc = isAIMessage ? `/chatmancer.webp` : `/cat.webp`;
    const isDiverseImageRequest = message.image_url;
    const isImageRequest = message.image_urls;

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: isAIMessage ? "flex-start" : "flex-end",
                maxWidth: "70%",
                margin: isAIMessage ? "10px auto 10px 10px" : "10px 10px 10px auto",
                backgroundColor: isAIMessage ? "#f5f5f5" : "#88c1f2",
                color: isAIMessage ? "black" : "white",
                borderRadius: isAIMessage ? "10px 10px 10px 0" : "10px 10px 0 10px",
                padding: "10px",
            }}
        >
            {!isDiverseImageRequest && !isImageRequest && (
                <Typography variant="body1" gutterBottom sx={fontstyle}>
                    {message.text}
                </Typography>
            )}

            {isImageRequest && (
                <>
                    <Typography variant="body1" gutterBottom sx={fontstyle}>
                        {message.text}
                    </Typography>
                    <Box display="flex" flexDirection="row" alignItems="center" gap={2}>
                        {(message.image_urls ?? []).map((url, index) => {
                            const cleanUrl = url.trim().replace(/^"(.*)"$/, "$1"); // Trim spaces and remove surrounding quotes if present
                            console.log(`Formatted URL ${index + 1}:`, cleanUrl); // Log to check URL formatting
                            return (
                                <a
                                    key={index} // Added key prop for React list rendering optimization
                                    href={cleanUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Avatar
                                        sx={{ width: 100, height: 100 }}
                                        src={cleanUrl}
                                        alt="Generated"
                                    />
                                </a>
                            );
                        })}
                    </Box>
                </>
            )}

            {isDiverseImageRequest && (
                <>
                    <Typography variant="body1" gutterBottom sx={fontstyle}>
                        {message.text}
                    </Typography>
                    <a
                        href={message.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Avatar
                            sx={{ width: 100, height: 100 }}
                            src={message.image_url}
                            alt="Generated"
                        />
                    </a>
                </>
            )}
            {(isImageRequest || isDiverseImageRequest) && (
                <>
                    <Typography variant="body1" gutterBottom sx={fontstyle}>
                        {isImageRequest ?
                            "Three images are created for you:"
                        :   "Check the new picure below:"}
                    </Typography>
                </>
            )}

            <Avatar alt={senderName} src={avatarSrc} />
            <Typography
                variant="subtitle2"
                sx={{
                    alignSelf: isAIMessage ? "flex-start" : "flex-end",
                    marginTop: "10px",
                }}
            >
                {senderName}
            </Typography>
        </Box>
    );
};
