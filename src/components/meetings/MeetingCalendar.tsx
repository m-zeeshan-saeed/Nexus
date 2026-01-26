import React, { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isToday,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Meeting } from "../../types";
import meetingService from "../../services/meetingService";
import { Badge } from "../ui/Badge";
import { Card, CardBody } from "../ui/Card";

export const MeetingCalendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMeetings = async () => {
      setIsLoading(true);
      try {
        const data = await meetingService.getMeetings();
        setMeetings(data);
      } catch (error) {
        console.error("Failed to fetch meetings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const meetingsOnSelectedDate = meetings.filter(
    (meeting) =>
      selectedDate && isSameDay(parseISO(meeting.startTime), selectedDate),
  );

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "accepted":
        return "success";
      case "rejected":
        return "error";
      case "cancelled":
        return "gray";
      case "pending":
        return "warning";
      default:
        return "primary";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Calendar Grid */}
      <Card className="lg:col-span-2">
        <CardBody className="p-0">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-medium text-gray-500 uppercase"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const dayMeetings = meetings.filter((m) =>
                isSameDay(parseISO(m.startTime), day),
              );
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const today = isToday(day);

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[100px] p-2 border-r border-b cursor-pointer transition-colors ${
                    !isCurrentMonth ? "bg-gray-50" : "bg-white"
                  } ${isSelected ? " ring-2 ring-primary-500 ring-inset" : "hover:bg-blue-50"}`}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`text-sm font-medium ${
                        today
                          ? "bg-primary-600 text-white w-6 h-6 flex items-center justify-center rounded-full"
                          : isCurrentMonth
                            ? "text-gray-900"
                            : "text-gray-400"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                    {dayMeetings.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                    )}
                  </div>

                  <div className="mt-1 space-y-1">
                    {dayMeetings.slice(0, 2).map((m, i) => (
                      <div
                        key={i}
                        className="text-[10px] truncate px-1 py-0.5 rounded bg-blue-100 text-blue-700"
                      >
                        {m.title}
                      </div>
                    ))}
                    {dayMeetings.length > 2 && (
                      <div className="text-[10px] text-gray-500 font-medium pl-1">
                        + {dayMeetings.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Selected Date Summary */}
      <div className="space-y-4">
        <Card>
          <CardBody>
            <h3 className="font-semibold text-gray-900 flex items-center mb-4">
              <CalendarIcon size={18} className="mr-2 text-primary-600" />
              {selectedDate
                ? format(selectedDate, "MMMM d, yyyy")
                : "Select a date"}
            </h3>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : meetingsOnSelectedDate.length > 0 ? (
              <div className="space-y-4">
                {meetingsOnSelectedDate.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="p-3 border rounded-lg hover:border-primary-300 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {meeting.title}
                      </h4>
                      <Badge
                        variant={getStatusVariant(meeting.status)}
                        size="sm"
                      >
                        {meeting.status}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock size={14} className="mr-1" />
                        {format(parseISO(meeting.startTime), "h:mm a")} -{" "}
                        {format(parseISO(meeting.endTime), "h:mm a")}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <MapPin size={14} className="mr-1" />
                        {meeting.location}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                <p className="text-sm text-gray-500">
                  No meetings scheduled for this day
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
          <h4 className="text-sm font-semibold text-primary-900 mb-1">
            Quick Tip
          </h4>
          <p className="text-xs text-primary-700">
            Click on any date in the calendar to see the detailed schedule and
            manage your appointments.
          </p>
        </div>
      </div>
    </div>
  );
};
