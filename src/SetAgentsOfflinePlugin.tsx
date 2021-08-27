import React from 'react';
import * as Flex from '@twilio/flex-ui';
import { FlexPlugin } from 'flex-plugin';
import { Manager } from '@twilio/flex-ui';

const PLUGIN_NAME = 'SetAgentsOfflinePlugin';

// Hour of the evening to move the Activity of the Agent to offline. Dont use "9 PM", instead use 21.
const MOVE_AGENTS_TO_OFFLINE_AFTER = 21;

interface changeActivityToOffline {
  activityAvailable: boolean;
}
export default class SetAgentsOfflinePlugin extends FlexPlugin {
  intervalId: any;
  offlineSid: string | undefined;
  manager = Manager.getInstance();

  constructor() {
    super(PLUGIN_NAME);
  }
  init(flex: typeof Flex) {
    const options: Flex.ContentFragmentProps = { sortOrder: -1 };

    this.offlineSid = this.findOfflineActivitySid();

    this.changeActivityToOffline();
    Flex.Actions.addListener('afterSetActivity', this.changeActivityToOffline);
  }

  findOfflineActivitySid() {
    const offlineSids = [...Array.from(this.manager.workerClient.activities.values())].filter((a) => a?.name?.toLowerCase() === 'offline');

    if (offlineSids.length === 0) {
      throw new Error(
        `${SetAgentsOfflinePlugin} - Ops, I cound not find the "Offline" activity. It seems your Workspace does not have it an activity with the name of "Offline", no?! This plugin wont run...`
      );
    }

    return offlineSids[0].sid;
  }

  changeActivityToOffline = () => {
    const currentSid = this.manager.workerClient.activity.sid;
    const isOffline = this.offlineSid === currentSid;

    // disable timer
    if (isOffline && this.intervalId) {
      console.log(`${PLUGIN_NAME} - disabling timer...`);
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    // enable timer
    if (!isOffline && !this.intervalId) {
      console.log(`${PLUGIN_NAME} - enabling timer...`);

      this.intervalId = setInterval(() => {
        const hour = new Date().getHours();
        if (hour >= MOVE_AGENTS_TO_OFFLINE_AFTER) {
          this.goOffline();
        }
      }, 5000);
    }
  };

  goOffline = () => {
    console.log(`${PLUGIN_NAME} - going offline...`);
    window.Twilio.Flex.Actions.invokeAction('SetActivity', { activitySid: this.offlineSid });
  };
}
