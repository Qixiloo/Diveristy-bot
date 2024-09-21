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

const isProduction = import.meta.env.MODE === "production";
const apiRootPath = isProduction ? "" : "/api";
console.log("apiRootPath", apiRootPath);

export function Chatbot() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // const [info, setInfo] = useState<string | null>(null);
    // const [contextFile, setContextFile] = useState<string | null>(null);
    const sendNotification = useNotification();

    useEffect(() => {
        if (error) {
            sendNotification({ msg: error, variant: "error" });
        }
    }, [error, sendNotification]);

    // useEffect(() => {
    //     if (info) {
    //         sendNotification({ msg: info, variant: "info" });
    //     }
    // }, [info, sendNotification]);

    // const clearContextFile = async () => {
    //     try {
    //         const response = await fetch(`${apiRootPath}/clear_context_file`, {
    //             method: "POST",
    //         });

    //         const data = await response.json();
    //         if (data?.response) {
    //             setInfo(data.response);
    //             setContextFile(null);
    //         } else {
    //             setError("Error Clearing Context File.");
    //         }
    //     } catch (error) {
    //         console.error("Error clearing context file:", error);
    //         setError("An error occurred while clearing context file.");
    //     }
    // };

    // const fetchContextFile = async () => {
    //     try {
    //         const response = await fetch(`${apiRootPath}/context_file`);
    //         const data = await response.json();
    //         console.log(data);
    //         if (data?.response) {
    //             setContextFile(data.response);
    //             if (file) setFile(null);
    //         }
    //     } catch (error) {
    //         console.error("Error fetching context file:", error);
    //         setError("An error occurred while fetching context file.");
    //     }
    // };

    useEffect(() => {
        const fetchChatHistory = async () => {
            try {
                const response = await fetch(`${apiRootPath}/chat`);
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
                // if (file) {
                //     formData.append("file", file);
                // }
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
                    // if (file) setFile(null);
                }
            } catch (error) {
                console.error("Error sending message:", error);
                setError("An error occurred while sending the message.");
            } finally {
                setLoading(false);
                setInputValue(""); // Clear the input field after sending the message
            }
        }
    };

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView();
        }
    }, [messages]);

    // State for file input element
    // const [fileInputKey, setFileInputKey] = useState(Date.now());

    // const handleUploadClick = () => {
    //     // Trigger file input click
    //     document.getElementById("file-upload-input")?.click();
    // // };
    // const [file, setFile] = useState<File | null>(null);

    // const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    //     const file = event.target.files ? event.target.files[0] : null;
    //     const MAX_FILE_SIZE = 250 * 1024 * 1024;
    //     if (file && file.size > MAX_FILE_SIZE) {
    //         setError("File size should be less than 250MB.");
    //     } else if (file) {
    //         console.log(file);
    //         setFile(file);
    //         setInfo("File added successfully.");
    //         // Reset the file input after selection
    //         setFileInputKey(Date.now());
    //     }
    // };

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
                    // backgroundColor: "red",
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
                {/* {file && !contextFile && (
                    <Chip
                        color="success"
                        label={file.name}
                        onDelete={() => setFile(null)}
                    />
                )} */}

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
    // const isShareStoryRequest = message.content.startsWith("Share your story: ");
    // const isTheirOwnWordsRequest = message.content.startsWith("In their own words: ");

    // const extractUrl = ({ message }: ChatMessageProps) => {
    //     // Check if the text includes the phrase for diverse prompts
    //     if (isDiverseImageRequest) {
    //         // For the more diverse image requests
    //         return message.image_urls.split(",").map((url) => url.trim().slice(1, -1));
    //     } else {
    //         // For the standard image requests
    //         console.log("1", text.split(": ")[1].slice(1, -1));
    //         return text.split(": ")[1].slice(1, -1);
    //     }
    // };

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
                    {/* 
                    <Typography variant="body1" gutterBottom sx={fontstyle}>
                        {isImageRequest &&
                            "Have you notice any steretotypes in the images🤔"}
                    </Typography> */}

                    {/* <Typography
                        variant="body1"
                        gutterBottom
                        align="left"
                        sx={fontstyle}
                    >
                        {isDiverseImageRequest &&
                            `The updated prompt is:  ${message.content.split(" and the new prompt is: ")[1]}`}
                    </Typography> */}
                    {/* 
                    {isDiverseImageRequest && (
                        <a
                            href={extractUrl(message.text)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Avatar
                                sx={{ width: 100, height: 100 }}
                                src={extractUrl(message.content)}
                                alt="Generated"
                            />
                        </a>
                    )} */}

                    {/* {isImageRequest && (
                        <Box
                            display="flex"
                            flexDirection="row"
                            alignItems="center"
                            gap={2}
                        >
                            {extractUrl(message.content)
                                .split(",")
                                .map((url, index) => {
                                    const cleanUrl = url.trim().slice(1, -1); // Trim spaces and remove quotes
                                    console.log(cleanUrl); // Log to check URL formatting
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
                    )} */}
                    {/* <Typography
                        variant="body1"
                        align="left"
                        gutterBottom
                        mt={2}
                        sx={fontstyle}
                    >
                        {isDiverseImageRequest ?
                            "We generate images by expanding the user's input prompt, in order to indicate their diverse appearances, interests, and professions etc."
                        :   'Considering that the model is trained based on data, it is prone to stereotypes in generated images. We are working to improve this. Please try the "/diverse-image describe an autistic person in real life" to see the improvements.'
                        }
                    </Typography> */}
                    {/* {isDiverseImageRequest && (
                        <ul
                            style={{
                                listStyle: "none",
                                textAlign: "left",
                                marginTop: "2px",
                            }}
                        >
                            <li>
                                <Typography sx={fontstyle} gutterBottom>
                                    Want to see why these stereotypes are generated? try
                                    syntax <strong>/why</strong>
                                </Typography>
                            </li>
                            <li>
                                <Typography sx={fontstyle} gutterBottom>
                                    What it's like to be autistic: in their own words.
                                    try syntax <strong>/how</strong>
                                </Typography>
                            </li>
                            <li>
                                <Typography sx={fontstyle} gutterBottom>
                                    We would like to hear your story and thoughts about
                                    autism as well as your feedback. try syntax{" "}
                                    <strong>/story</strong>
                                </Typography>
                            </li>
                            <li>
                                <Typography sx={fontstyle} gutterBottom>
                                    Don't foget that I'm a ChatBot, just start the
                                    conversation with me, I would like to hear from you.
                                </Typography>
                            </li>
                        </ul>
                    )} */}
                </>
            )}

            {/* {isShareStoryRequest && (
                <a
                    onMouseEnter={(e) => (e.currentTarget.style.color = "blue")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "black")}
                    href={message.content.split("Share your story: ")[1]}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Typography gutterBottom sx={fontstyle}>
                        <strong>We are looking for your story and feedback!</strong>
                    </Typography>
                </a>
            )}
            {isTheirOwnWordsRequest && (
                <a
                    onMouseEnter={(e) => (e.currentTarget.style.color = "blue")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "black")}
                    href={message.content.split("In their own words: ")[1]}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Typography gutterBottom sx={fontstyle}>
                        <strong>Click Me!</strong>
                    </Typography>
                </a>
            )}

            {!isTheirOwnWordsRequest &&
                !isDiverseImageRequest &&
                !isImageRequest &&
                !isShareStoryRequest && (
                    <Typography variant="body1" gutterBottom sx={fontstyle}>
                        {message.content}
                    </Typography>
                )} */}

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
