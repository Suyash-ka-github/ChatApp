import jwt from "jsonwebtoken";

export const generateToken = async (user: any) => {

    return jwt.sign(
        {
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
        },

        process.env.JWT_SECRET as string,

        {
            expiresIn: "1d",
        }
    );
};