import React from "react";
import { MeetingCalendar } from "../../components/meetings/MeetingCalendar";

export const MeetingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your Schedule</h1>
        <p className="text-gray-600">Manage your meetings and appointments</p>
      </div>

      <MeetingCalendar />
    </div>
  );
};

export default MeetingsPage;
