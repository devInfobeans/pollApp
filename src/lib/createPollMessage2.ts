import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';


import { IPoll } from '../IPoll';
import { createPollBlocks } from './createPollBlocks';

export async function createPollMessage2(data: any, read: IRead, modify: IModify, persistence: IPersistence, uid: string) {
    const { id, state, record, user, room, identifier, title, deadline, correctAnswer } = data;

    if (!state.poll || !state.poll.question || state.poll.question.trim() === '') {
        throw { question: 'Please type your question here' };
    }

    const options = Object.entries<any>(state.poll || {})
        .filter(([key]) => key !== 'question')
        .map(([, option]) => option)
        .filter((option) => option.trim() !== '');

    if (!options.length) {
        throw {
            'option-0': 'Please provide some options',
            'option-1': 'Please provide some options',
        };
    }

    if (options.length === 1) {
        throw {
            'option-1': 'Please provide one more option',
        };
    }

    try {
     
        const { config = { mode: 'multiple', visibility: 'open' } } = state;
        
        const { mode = 'multiple', visibility = 'open' } = config;

        const showNames = await read.getEnvironmentReader().getSettings().getById('use-user-name');

        const builder = modify.getCreator().startMessage()
            .setUsernameAlias((showNames.value && data.user.name) || data.user.username)
            .setRoom(record.room)
            .setText(state.poll.question);

        const poll: IPoll = {
            question: state.poll.question,
            uid,
            msgId: '',
            identifier: '',
            roomId: '',
            t:'poll',
            options,
            finished:false,
            title: '',
            deadline: '',
            totalVotes: 0,
            participators:[],
            rearrangedVotes:{},
            votes: options.map(() => ({ quantity: 0, voters: [] })),
            confidential: visibility === 'confidential',
            singleChoice: mode === 'single',
        };

        const block = modify.getCreator().getBlockBuilder();
        createPollBlocks(block, poll.question, options, poll, showNames.value);

        builder.setBlocks(block);

        const messageId = await modify.getCreator().finish(builder);
        poll.msgId = messageId;
        poll.identifier = identifier;
        poll.roomId = room;
        poll.title = title;
        poll.deadline = deadline;
        const pollAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, messageId);
        const message = await modify.getUpdater().message(messageId as string, user);
        message.setEditor(message.getSender());
        message.addCustomField("data", poll);
        modify.getUpdater().finish(message)
        const pollData = await persistence.createWithAssociation(poll, pollAssociation);
    } catch (e) {
        throw e;
    }
}
