import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, } from '@rocket.chat/apps-engine/definition/api';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { finishPollMessage } from './lib/finishPollMessage';
// import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { createPollMessage2 } from '../src/lib/createPollMessage2';
import { votePoll } from './lib/votePoll';
import { getPoll } from './lib/getPoll';
import { createQuizMessage } from './lib/createQuizMessage';
import { createPollBlocks } from './lib/createPollBlocks';
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


            const { question, options, identifier, rooms, title, deadline, mode = 'multiple', visibility = 'open' } = request.content;

            var id = uuid.v4();
            const state = {
                config: { mode, visibility },
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
                const userId = 'BBg2LwFWbBMqbhxpy';
                // const userId = 'YxPwijjwM9AH4XMfB';
                const data = { id, state, record, user: { userId, username: 'poll.bot', }, room, identifier, title, deadline }

                createPollMessage2(data, read, modify, persis, data.user.userId)
            })



            return this.success({ message: "Poll created successfully" })

        } catch (error) {
            console.log(error);
        }

    }

}
export class GenerateQuiz extends ApiEndpoint {
    public path = 'api/quiz';
    public example = [];

    public post(request: IApiRequest, endpoint: IApiEndpointInfo, read: IRead, modify: IModify,
        http: IHttp, persis: IPersistence): any {

        try {


            const { question, hintEnabled = false, hintMessage = '', options, identifier, rooms, title, deadline, mode = 'multiple', visibility = 'open', correctAnswer = [] } = request.content;

            var id = uuid.v4();
            const state = {
                config: { mode, visibility },
                poll: { question: question, ...options }
            }
            let roomIdArray = rooms;
            console.log("generating quiz for rooms", rooms);
            roomIdArray.forEach(room => {
                const record = {
                    room: {
                        id: room,
                    }
                };
                const userId = 'BBg2LwFWbBMqbhxpy';
                // const userId = 'YxPwijjwM9AH4XMfB';
                const data = { id, state, hintEnabled, hintMessage, record, user: { userId, username: 'poll.bot', }, room, identifier, title, deadline, correctAnswer }

                createQuizMessage(data, read, modify, persis, data.user.userId)
            })



            return this.success({ message: "Quiz created successfully" })

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
                // user: { id: 'r5w7vSqwoPAt66NwH' }
            }

            await finishPollMessage({ data, read, persistence, modify });
        })


        return this.success({ message: "Poll finished successfully" })
    }
}
export class FinishQuiz extends ApiEndpoint {
    public path = 'api/finishQuiz';
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
                // user: { id: 'r5w7vSqwoPAt66NwH' }
            }

            await finishPollMessage({ data, read, persistence, modify });
        })


        return this.success({ message: "Quiz finished successfully" })
    }
}
export class CastVote extends ApiEndpoint {
    public path = 'api/castVote';
    public example = [];

    public async post(request: IApiRequest, endpoint: IApiEndpointInfo, read: IRead, modify: IModify,
        http: IHttp, persistence: IPersistence): Promise<any> {

        try {
            const { values = [], messageId, userId, username, order = [] } = request.content;

            if (order.length !== 0) {
                const data = {
                    "appId": "c33fa1a6-68a7-491e-bf49-9d7b99671c48",
                    "actionId": "vote",
                    "user": {
                        "id": userId,
                        "username": username
                    },
                    "value": "0",
                    "message": { "id": messageId },
                    "order": order
                }
                await votePoll({ data, read, persistence, modify });
            } else {
                const data2 = {
                    "user": {
                        "id": userId,
                        "username": username
                    }
                };

                for (let value of values) {
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
                }
                const poll = await getPoll(String(messageId), read);
                const message = await modify.getUpdater().message(messageId as string, data2.user as any);
                message.setEditor(message.getSender());
                message.addCustomField("data", poll);
                const block = modify.getCreator().getBlockBuilder();

                const showNames = await read.getEnvironmentReader().getSettings().getById('use-user-name');

                createPollBlocks(block, poll.question, poll.options, poll, showNames.value);

                message.setBlocks(block);

                modify.getUpdater().finish(message);
            }
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
    title: string,
    t: string,
    deadline: string;
    totalVotes: number;
    votes: Array<IVoter>;
    finished?: boolean;
    rearrangedVotes: any;
    participators: Array<string>;
    confidential?: boolean;
    singleChoice?: boolean;
}

export interface IQuiz {
    msgId: string;
    identifier: string;
    uid: string; // user who created the poll
    question: string;
    roomId: string;
    options: Array<string>;
    title: string,
    t: string,
    deadline: string;
    correctAnswer: Array<string>;
    totalVotes: number;
    hintEnabled?: boolean;
    hintMessage: string;
    votes: Array<IVoter>;
    rearrangedVotes: any;
    participators: Array<string>;
    finished?: boolean;
    confidential?: boolean;
    singleChoice?: boolean;
}