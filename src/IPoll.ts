import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, } from '@rocket.chat/apps-engine/definition/api';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { finishPollMessage } from './lib/finishPollMessage';
// import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { createPollMessage2 } from '../src/lib/createPollMessage2';
import { votePoll } from './lib/votePoll';
// import { PollCommandContext } from './PollCommandContext';
var uuid = require("uuid");


export type IVoterPerson = Pick<IUser, 'id' | 'username' | 'name'>;

export interface IVoter {
    quantity: number;
    voters: Array<IVoterPerson>;
}


export class GeneratePoll extends ApiEndpoint {
    public path = 'api/poll';
    public example = [];

    public post(request: IApiRequest, endpoint: IApiEndpointInfo, read: IRead, modify: IModify,
        http: IHttp, persis: IPersistence): any {

        try {


            const { question, options, identifier, rooms } = request.content;
            var id = uuid.v4();
            const state = {
                config: { mode: 'multiple', visibility: 'open' },
                poll: { question: question, ...options }
            }
            let roomIdArray = rooms;
            console.log("generating poll for rooms", rooms);
            roomIdArray.forEach(room => {
                const record = {
                    room: {
                        id: room,
                    }
                };
                const userId = 'tJXxzcN4BTadyWgBz';
                const data = { id, state, record, user: { userId, username: 'chatbot', }, room, identifier }

                createPollMessage2(data, read, modify, persis, data.user.userId)
            })



            return this.success({ message: "Poll created successfully" })

        } catch (error) {
            console.log(error);
        }

    }

}
export class FinishPoll extends ApiEndpoint {
    public path = 'api/finishPoll';
    public example = [];

    public async post(request: IApiRequest, endpoint: IApiEndpointInfo, read: IRead, modify: IModify,
        http: IHttp, persistence: IPersistence): Promise<any> {
        const { identifier } = request.content;
        const pollMessageIdArray: any = [];
        const polls: any = await read.getPersistenceReader().read(identifier);
        polls.forEach((obj: any) =>
            pollMessageIdArray.push(obj.data.msgId)
        )

        pollMessageIdArray.forEach(async poll => {
            const data = {
                message: { id: poll },
                user: { id: 'mgn2DjDaSeZkFKRhv' }
            }

            await finishPollMessage({ data, read, persistence, modify });
        })


        return this.success({ message: "Poll finished successfully" })
    }
}

export class CastVote extends ApiEndpoint {
    public path = 'api/castVote';
    public example = [];

    public async post(request: IApiRequest, endpoint: IApiEndpointInfo, read: IRead, modify: IModify,
        http: IHttp, persistence: IPersistence): Promise<any> {

        try {
            const { value, messageId, userId, username } = request.content;
            const data = {
                "appId": "c33fa1a6-68a7-491e-bf49-9d7b99671c48",
                "actionId": "vote",
                "user": {
                    "id": userId,
                    "username": username
                },
                "value": value,
                "message": { "id": messageId }
            }
            await votePoll({ data, read, persistence, modify });
            return this.success({ message: "Vote casted successfully" })
        } catch (error) {
            console.log(error);
        }

    }
}

export interface IPoll {
    msgId: string;
    identifier: string;
    uid: string; // user who created the poll
    question: string;
    roomId: string;
    options: Array<string>;
    totalVotes: number;
    votes: Array<IVoter>;
    finished?: boolean;
    confidential?: boolean;
    singleChoice?: boolean;
}
