import React, { useState } from "react";
import { Calendar, Clock, MapPin, X } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Meeting } from "../../types";
import meetingService from "../../services/meetingService";
import toast from "react-hot-toast";
import { format, addHours, parseISO } from "date-fns";

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  investorId: string;
  entrepreneurId: string;
  onSuccess?: (meeting: Meeting) => void;
}

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  isOpen,
  onClose,
  investorId,
  entrepreneurId,
  onSuccess,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState(format(new Date(), "HH:mm"));
  const [duration, setDuration] = useState("1"); // hours
  const [location, setLocation] = useState("Google Meet");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const startTime = parseISO(`${date}T${time}`);
      const endTime = addHours(startTime, parseFloat(duration));

      const meeting = await meetingService.scheduleMeeting({
        title,
        description,
        investorId,
        entrepreneurId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        location,
      });

      toast.success("Meeting scheduled successfully!");
      if (onSuccess) onSuccess(meeting);
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message =
        err.response?.data?.message || "Failed to schedule meeting";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-slide-in">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Schedule Meeting
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <Input
            label="Meeting Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Pitch Deck Review"
            required
            fullWidth
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What would you like to discuss?"
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              fullWidth
              startAdornment={<Calendar size={16} />}
            />
            <Input
              label="Start Time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              fullWidth
              startAdornment={<Clock size={16} />}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (Hours)
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                <option value="0.5">30 minutes</option>
                <option value="1">1 hour</option>
                <option value="1.5">1.5 hours</option>
                <option value="2">2 hours</option>
              </select>
            </div>
            <Input
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Zoom, Office"
              fullWidth
              startAdornment={<MapPin size={16} />}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Schedule Meeting
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
