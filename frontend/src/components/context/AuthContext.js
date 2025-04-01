import React, { createContext,useEffect, useReducer } from "react";

const initialState = {
    user:localStorage.getItem('user')!==undefined? JSON.parse(localStorage.getItem('user')): null
};

export const AuthContext = createContext(initialState);

const AuthReducer = (state, action) => {
    switch (action.type) {
        case "LOGIN_START":
            return {
                user: null
            };

        case "LOGIN_SUCCESS":
            return {
                user: action.payload.user
            };

        case "LOGOUT":
            return {
                user: null
            };
        
        default: return state;
    }
};

export const AuthContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(AuthReducer, initialState);
    useEffect(()=> {
        localStorage.setItem("user", JSON.stringify(state.user));
    }, [state]);

    return (
        <AuthContext.Provider value={{ user: state.user, dispatch }}>
            {children}
        </AuthContext.Provider>
    );
}
