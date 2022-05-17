import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, } from '@rocket.chat/apps-engine/definition/api';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { finishPollMessage } from './lib/finishPollMessage';
// import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { createPollMessage2 } from '../src/lib/createPollMessage2';
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


            const { question, option0, option1, identifier } = request.content;
            var id = uuid.v4();
            const state = {
                config: { mode: 'multiple', visibility: 'open' },
                poll: { question: question, 'option-0': option0, 'option-1': option1 }
            }
            let roomIdArray = ['xZWFFCeBSckbZZmH5', 'dCZdNSXuwvPALw9EC']
            roomIdArray.forEach(room => {
                const record = {
                    room: {
                        id: room,
                    }
                };
                const userId = 'r5w7vSqwoPAt66NwH';
                const data = { id, state, record, user: { userId, username: 'devanshu.tiwari', }, identifier }

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
                user: { id: 'zvXB9nTtB9LQK4R3z' }
            }

            await finishPollMessage({ data, read, persistence, modify });
        })


        return this.success({ message: "Poll finished successfully" })
    }
}

export interface IPoll {
    msgId: string;
    identifier: string;
    uid: string; // user who created the poll
    question: string;
    options: Array<string>;
    totalVotes: number;
    votes: Array<IVoter>;
    finished?: boolean;
    confidential?: boolean;
    singleChoice?: boolean;
}
