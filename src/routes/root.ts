import { RouteOptions } from "fastify";
import { IncomingMessage, Server, ServerResponse } from "http";
import { CookieSerializeOptions } from "@fastify/cookie";
import { MongoUser } from "../models/MongoUser";
import { utils } from "../extra/Utils";
import { config } from "../config";
import { UserRole } from "../models/MongoUser";
import { LoggingHelper } from "../helpers/LoggingHelper";

export const root: RouteOptions<Server, IncomingMessage, ServerResponse> = {
    method: 'GET',
    url: '/',
    schema: {},
    async handler(request, response) {
        // Проверяем, есть ли уже токен в куках
        const existingToken = request.cookies.token;
        const existingUserId = request.cookies.userid;

        if (existingToken && existingUserId) {
            // Если токен уже есть, просто перенаправляем на фронтенд
            return response.redirect(config.frontend);
        }

        // Генерируем уникальный ID для пользователя
        const userId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const username = `Guest_${Math.random().toString(36).substr(2, 6)}`;
        const token = utils.generateToken();

        // Проверяем, существует ли уже пользователь с таким IP
        const existingUser = await request.server.database.users
            .findOne(
                {
                    userID: { $regex: `^guest_.*_${request.ip.replace(/[^a-zA-Z0-9]/g, '')}$` }
                },
                {
                    projection: {
                        _id: 0,
                        userID: 0,
                        username: 0
                    }
                }
            );

        let finalUserId = userId;
        let finalUsername = username;
        let finalToken = token;

        if (existingUser) {
            // Если пользователь уже существует, используем его данные
            finalUserId = existingUser.userID;
            finalUsername = existingUser.username;
            finalToken = existingUser.token;
        } else {
            // Создаем нового пользователя
            await request.server.database.users
                .updateOne(
                    {
                        userID: finalUserId
                    },
                    {
                        $set: {
                            token: finalToken,
                            userID: finalUserId,
                            username: finalUsername,
                            cooldown: 0,
                            tag: null,
                            badges: [],
                            points: 0,
                            role: UserRole.User,
                            banned: null
                        }
                    },
                    { upsert: true }
                );
        }

        LoggingHelper.sendLoginSuccess({
            userID: finalUserId,
            nickname: finalUsername,
            method: "Auto",
            ip: request.headers["cf-connecting-ip"]
                ? Array.isArray(request.headers["cf-connecting-ip"])
                    ? request.headers["cf-connecting-ip"][0]
                    : request.headers["cf-connecting-ip"]
                : request.ip
        });

        const params: CookieSerializeOptions = {
            domain: config.frontend.split('//')[1].split(':')[0],
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14), // 2 weeks
            path: '/',
            httpOnly: false,
            sameSite: "none",
            secure: true
        }

        return response
            .cookie('token', finalToken, params)
            .cookie('userid', finalUserId, params)
            .redirect(config.frontend);
    }
}