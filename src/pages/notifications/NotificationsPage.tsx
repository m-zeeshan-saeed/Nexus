import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  MessageCircle,
  UserPlus,
  DollarSign,
  Calendar,
  Trash2,
} from "lucide-react";
import { Card, CardBody } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { notificationService } from "../../services/notificationService";
import { Notification } from "../../types";
import { formatDistanceToNow, parseISO } from "date-fns";
import toast from "react-hot-toast";

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    if (user) {
      try {
        const data = await notificationService.getNotifications();
        setNotifications(data);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageCircle size={18} className="text-primary-600" />;
      case "collaboration_request":
        return <UserPlus size={18} className="text-secondary-600" />;
      case "collaboration_accepted":
        return <DollarSign size={18} className="text-accent-600" />;
      case "meeting_scheduled":
      case "meeting_status":
        return <Calendar size={18} className="text-success-600" />;
      default:
        return <Bell size={18} className="text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">
            Stay updated with your latest network activity
          </p>
        </div>

        {notifications.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <Link
              key={notification.id}
              to={notification.link}
              onClick={() =>
                !notification.isRead && handleMarkAsRead(notification.id)
              }
              className="block"
            >
              <Card
                className={`transition-all duration-200 border-l-4 hover:shadow-md ${
                  notification.isRead
                    ? "bg-white border-transparent"
                    : "bg-primary-50 border-primary-500"
                }`}
              >
                <CardBody className="flex items-start p-4">
                  <div
                    className={`p-2 rounded-full mr-4 ${
                      notification.isRead ? "bg-gray-100" : "bg-white shadow-sm"
                    }`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <h3
                          className={`text-sm font-semibold truncate ${
                            notification.isRead
                              ? "text-gray-700"
                              : "text-gray-900"
                          }`}
                        >
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <Badge variant="primary" size="sm" rounded>
                            New
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {formatDistanceToNow(parseISO(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>

                    <p
                      className={`text-sm mt-1 leading-relaxed ${
                        notification.isRead ? "text-gray-500" : "text-gray-600"
                      }`}
                    >
                      {notification.message}
                    </p>
                  </div>

                  <button
                    onClick={(e) =>
                      handleDeleteNotification(notification.id, e)
                    }
                    className="ml-4 p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded-full transition-colors"
                    aria-label="Delete notification"
                  >
                    <Trash2 size={16} />
                  </button>
                </CardBody>
              </Card>
            </Link>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4 text-gray-400">
              <Bell size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No notifications
            </h3>
            <p className="text-gray-500 mt-1">
              We'll let you know when something important happens.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
