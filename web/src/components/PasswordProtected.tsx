import { LoadingButton } from "@mui/lab";
import { TextField, Typography, Box } from "@mui/material";
import { ChangeEvent, FormEvent, ReactNode, useState } from "react";
interface InputNameProps {
    children: ReactNode;
}
const path = import.meta.env.VITE_API_URL;

const isProduction = import.meta.env.MODE === "production";
console.log("Modessss", import.meta.env.MODE);
const apiRootPath = isProduction ? path : "/api";
console.log("apiRootPath", apiRootPath);

/**
 * `PasswordProtected` is a React component that wraps its children with password protection.
 * It renders a form that asks the user for a password. When the form is submitted, it sends a POST request to the '/verify-password' endpoint with the entered password.
 * If the server responds with a status of OK, the component sets `isAuthenticated` to true and renders its children.
 * If the server responds with an error, the component displays the error message.
 *
 * @component
 * @param {ReactNode} children - The children to render when the user is authenticated.
 */
function InputName({ children }: InputNameProps) {
    const [loading, setLoading] = useState(false);
    // const [password, setPassword] = useState<string>("");
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<string>("");

    // const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    //     setPassword(event.target.value);
    // };

    const handleUserChange = (event: ChangeEvent<HTMLInputElement>) => {
        setUser(event.target.value);
    };

    // const handleSubmit = async (event: FormEvent) => {
    //     event.preventDefault();
    //     setLoading(true);
    //     try {
    //         const response = await fetch(apiRootPath + "/verify-password", {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json",
    //             },
    //             body: JSON.stringify({ password }),
    //         });

    //         if (response.ok) {
    //             setIsAuthenticated(true);
    //         } else {
    //             const { message } = await response.json();
    //             console.error(message);
    //             setError(message);
    //         }
    //     } catch (error) {
    //         setError("An error occurred while verifying the password.");
    //     } finally {
    //         setLoading(false);
    //     }
    // };
    console.log("API Root Path:", apiRootPath);
    const handleSubmitUserName = async (event: FormEvent) => {
        event.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(apiRootPath + "/add_user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: user }),
            });

            console.log("the response is: " + response);
            if (response.ok) {
                setIsAuthenticated(true);
            } else {
                const responseData = await response.json();
                const detail = responseData.error;
                setError(detail || "An unexpected error occurred.");
            }
        } catch (error) {
            setError("An error occurred while adding the user.");
        } finally {
            setLoading(false);
        }
    };

    if (isAuthenticated) {
        return children;
    }

    return (
        <Box
            component="form"
            onSubmit={handleSubmitUserName}
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                minHeight: "100vh",
                margin: "0 auto",
                justifyContent: "center", // Vertically aligns the form to the center
                alignItems: "center", // Horizontally aligns the form to the center
            }}
        >
            <TextField
                required
                variant="outlined"
                value={user}
                onChange={handleUserChange}
                label="Type your name"
            />
            <LoadingButton loading={loading} type="submit">
                Submit
            </LoadingButton>
            {error && <Typography color="error">{error}</Typography>}
        </Box>
    );
}

export default InputName;
