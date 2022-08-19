import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';

import { createPollBlocks } from './createPollBlocks';
import { getPoll } from './getPoll';
import { storeVote } from './storeVote';

export async function votePoll({ data, read, persistence, modify }: {
    data,
    read: IRead,
    persistence: IPersistence,
    modify: IModify,
}) {
    if (!data.message) {
        return {
            success: true,
        };
    }
    let userId = data.user.id;

    const poll = await getPoll(String(data.message.id), read);
    if (!poll) {
        throw new Error('no such poll');
    }

    if (poll.finished) {
        throw new Error('poll is already finished');
    }
    const message = await modify.getUpdater().message(data.message.id as string, data.user);

    if (data.value === '0') {

        let reArrangedVotes = {};
        reArrangedVotes[userId] = data.order;
        poll.rearrangedVotes = { ...poll.rearrangedVotes, ...reArrangedVotes };
        if (!poll.participators.includes(userId)) { poll.participators.push(userId); }
        await storeVote(poll, parseInt(String(data.value), 10), data.user, { persis: persistence });
        message.setEditor(message.getSender());
        message.addCustomField("data", poll)
        return modify.getUpdater().finish(message);
    }
    else {
        if (!poll.participators.includes(userId)) { poll.participators.push(userId); }
        await storeVote(poll, parseInt(String(data.value), 10), data.user, { persis: persistence });

    }
}
