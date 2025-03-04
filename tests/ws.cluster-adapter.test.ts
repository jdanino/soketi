import { Server } from './../src/server';
import { Utils } from './utils';

jest.retryTimes(2);

describe('ws test for cluster adapter', () => {
    beforeEach(() => {
        jest.resetModules();

        return Utils.waitForPortsToFreeUp();
    });

    afterEach(() => {
        return Utils.flushServers();
    });

    Utils.shouldRun(Utils.adapterIs('cluster') && Utils.appManagerIs('array'))('client events with cluster adapter', done => {
        Utils.newServer({ 'appManager.array.apps.0.enableClientMessages': true }, (server1: Server) => {
            Utils.newClonedServer(server1, { 'appManager.array.apps.0.enableClientMessages': true, port: 6002 }, (server2: Server) => {
                let client1 = Utils.newClientForPrivateChannel();
                let channelName = `private-${Utils.randomChannelName()}`;

                client1.connection.bind('connected', () => {
                    client1.connection.bind('message', ({ event, channel, data }) => {
                        if (event === 'client-greeting' && channel === channelName) {
                            expect(data.message).toBe('hello');
                            done();
                        }
                    });

                    let channel = client1.subscribe(channelName);

                    channel.bind('pusher:subscription_succeeded', () => {
                        Utils.wait(3000).then(() => {
                            let client2 = Utils.newClientForPrivateChannel({}, 6002);

                            client2.connection.bind('connected', () => {
                                let channel = client2.subscribe(channelName);

                                channel.bind('pusher:subscription_succeeded', () => {
                                    channel.trigger('client-greeting', {
                                        message: 'hello',
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    Utils.shouldRun(Utils.adapterIs('cluster') && Utils.appManagerIs('array'))('client events dont get emitted when client messaging is disabled with cluster adapter', done => {
        Utils.newServer({ 'appManager.array.apps.0.enableClientMessages': false }, (server1: Server) => {
            Utils.newClonedServer(server1, { 'appManager.array.apps.0.enableClientMessages': false, port: 6002 }, (server2: Server) => {
                let client1 = Utils.newClientForPrivateChannel();
                let channelName = `private-${Utils.randomChannelName()}`;

                client1.connection.bind('connected', () => {
                    client1.connection.bind('message', ({ event, channel, data }) => {
                        if (event === 'client-greeting' && channel === channelName) {
                            throw new Error('The message was actually sent.');
                        }
                    });

                    let channel = client1.subscribe(channelName);

                    channel.bind('pusher:subscription_succeeded', () => {
                        Utils.wait(3000).then(() => {
                            let client2 = Utils.newClientForPrivateChannel({}, 6002);

                            client2.connection.bind('connected', () => {
                                let channel = client2.subscribe(channelName);

                                channel.bind('pusher:subscription_succeeded', () => {
                                    channel.bind('pusher:error', (error) => {
                                        expect(error.code).toBe(4301);
                                        done();
                                    });

                                    channel.trigger('client-greeting', {
                                        message: 'hello',
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    Utils.shouldRun(Utils.adapterIs('cluster') && Utils.appManagerIs('array'))('client events dont get emitted when event name is big with cluster adapter', done => {
        Utils.newServer({ 'appManager.array.apps.0.enableClientMessages': true, 'eventLimits.maxNameLength': 25 }, (server1: Server) => {
            Utils.newClonedServer(server1, { 'appManager.array.apps.0.enableClientMessages': true, 'eventLimits.maxNameLength': 25, port: 6002 }, (server2: Server) => {
                let client1 = Utils.newClientForPrivateChannel();
                let channelName = `private-${Utils.randomChannelName()}`;
                let eventName = 'client-a8hsuNFXUhfStiWE02R'; // 26 characters

                client1.connection.bind('connected', () => {
                    client1.connection.bind('message', ({ event, channel, data }) => {
                        if (event === eventName && channel === channelName) {
                            throw new Error('The message was actually sent.');
                        }
                    });

                    let channel = client1.subscribe(channelName);

                    channel.bind('pusher:subscription_succeeded', () => {
                        Utils.wait(3000).then(() => {
                            let client2 = Utils.newClientForPrivateChannel({}, 6002);

                            client2.connection.bind('connected', () => {
                                let channel = client2.subscribe(channelName);

                                channel.bind('pusher:subscription_succeeded', () => {
                                    channel.bind('pusher:error', (error) => {
                                        expect(error.code).toBe(4301);
                                        done();
                                    });

                                    channel.trigger(eventName, {
                                        message: 'hello',
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    Utils.shouldRun(Utils.adapterIs('cluster') && Utils.appManagerIs('array'))('client events dont get emitted when event payload is big with cluster adapter', done => {
        Utils.newServer({ 'appManager.array.apps.0.enableClientMessages': true, 'eventLimits.maxPayloadInKb': 1/1024/1024 }, (server1: Server) => {
            Utils.newClonedServer(server1, { 'appManager.array.apps.0.enableClientMessages': true, 'eventLimits.maxPayloadInKb': 1/1024/1024, port: 6002 }, (server2: Server) => {
                let client1 = Utils.newClientForPrivateChannel();
                let channelName = `private-${Utils.randomChannelName()}`;

                client1.connection.bind('connected', () => {
                    client1.connection.bind('message', ({ event, channel, data }) => {
                        if (event === 'client-greeting' && channel === channelName) {
                            throw new Error('The message was actually sent.');
                        }
                    });

                    let channel = client1.subscribe(channelName);

                    channel.bind('pusher:subscription_succeeded', () => {
                        Utils.wait(3000).then(() => {
                            let client2 = Utils.newClientForPrivateChannel({}, 6002);

                            client2.connection.bind('connected', () => {
                                let channel = client2.subscribe(channelName);

                                channel.bind('pusher:subscription_succeeded', () => {
                                    channel.bind('pusher:error', (error) => {
                                        expect(error.code).toBe(4301);
                                        done();
                                    });

                                    channel.trigger('client-greeting', {
                                        message: 'hello',
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    Utils.shouldRun(Utils.adapterIs('cluster') && Utils.appManagerIs('array'))('throw over quota error if reached connection limit for cluster adapter', done => {
        Utils.newServer({ 'appManager.array.apps.0.maxConnections': 1, port: 6001 }, (server1: Server) => {
            Utils.newClonedServer(server1, { 'appManager.array.apps.0.maxConnections': 1, port: 6002 }, (server2: Server) => {
                let client1 = Utils.newClient({}, 6001, 'app-key', false);

                client1.connection.bind('connected', () => {
                    Utils.wait(3000).then(() => {
                        let client2 = Utils.newClient({}, 6002, 'app-key', false);

                        client2.connection.bind('state_change', ({ current }) => {
                            if (current === 'failed') {
                                done();
                            } else {
                                throw new Error(`${current} is not an expected state.`);
                            }
                        });
                    });
                });
            });
        });
    });

    Utils.shouldRun(Utils.adapterIs('cluster'))('should check for presence.maxMembersPerChannel for cluster adapter', done => {
        Utils.newServer({ 'presence.maxMembersPerChannel': 1, port: 6001 }, (server1: Server) => {
            Utils.newClonedServer(server1, { 'presence.maxMembersPerChannel': 1, port: 6002 }, (server2: Server) => {
                let user1 = {
                    user_id: 1,
                    user_info: {
                        id: 1,
                        name: 'John',
                    },
                };

                let user2 = {
                    user_id: 2,
                    user_info: {
                        id: 2,
                        name: 'Alice',
                    },
                };

                let client1 = Utils.newClientForPresenceUser(user1);
                let channelName = `presence-${Utils.randomChannelName()}`;

                client1.connection.bind('connected', () => {
                    let channel1 = client1.subscribe(channelName);

                    channel1.bind('pusher:subscription_succeeded', () => {
                        Utils.wait(3000).then(() => {
                            let client2 = Utils.newClientForPresenceUser(user2, {}, 6002);

                            client2.connection.bind('message', ({ event, channel, data }) => {
                                if (event === 'pusher:subscription_error' && channel === channelName) {
                                    expect(data.type).toBe('LimitReached');
                                    expect(data.status).toBe(4100);
                                    expect(data.error).toBeDefined();
                                    done();
                                }
                            });

                            client2.subscribe(channelName);
                        });
                    });
                });
            });
        });
    });

    Utils.shouldRun(Utils.adapterIs('cluster'))('adapter getSockets works with cluster adapter', done => {
        Utils.newServer({}, (server1: Server) => {
            Utils.newClonedServer(server1, { port: 6002 }, (server2: Server) => {
                let client1 = Utils.newClient();

                client1.connection.bind('connected', () => {
                    Utils.wait(3000).then(() => {
                        server1.adapter.getSockets('app-id').then(sockets => {
                            expect(sockets.size).toBe(1);

                            Utils.wait(3000).then(() => {
                                let client2 = Utils.newClient({}, 6002);

                                client2.connection.bind('connected', () => {
                                    server1.adapter.getSockets('app-id').then(sockets => {
                                        expect(sockets.size).toBe(2);
                                        done();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    Utils.shouldRun(Utils.adapterIs('cluster'))('adapter getChannelSockets works with cluster adapter', done => {
        Utils.newServer({}, (server1: Server) => {
            Utils.newClonedServer(server1, { port: 6002 }, (server2: Server) => {
                let client1 = Utils.newClient();
                let channelName = Utils.randomChannelName();

                client1.connection.bind('connected', () => {
                    server1.adapter.getChannelSockets('app-id', channelName).then(sockets => {
                        expect(sockets.size).toBe(0);

                        let channel1 = client1.subscribe(channelName);

                        channel1.bind('pusher:subscription_succeeded', () => {
                            Utils.wait(3000).then(() => {
                                server1.adapter.getChannelSockets('app-id', channelName).then(sockets => {
                                    expect(sockets.size).toBe(1);

                                    Utils.wait(3000).then(() => {
                                        let client2 = Utils.newClient({}, 6002);

                                        client2.connection.bind('connected', () => {
                                            let channel2 = client2.subscribe(channelName);

                                            channel2.bind('pusher:subscription_succeeded', () => {
                                                Utils.wait(3000).then(() => {
                                                    server1.adapter.getChannelSockets('app-id', channelName).then(sockets => {
                                                        expect(sockets.size).toBe(2);

                                                        client2.unsubscribe(channelName);

                                                        Utils.wait(3000).then(() => {
                                                            server1.adapter.getChannelSockets('app-id', channelName).then(sockets => {
                                                                expect(sockets.size).toBe(1);
                                                                done();
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});
