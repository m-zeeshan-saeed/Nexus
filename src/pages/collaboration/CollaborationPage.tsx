import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Send, CheckCircle, XCircle, Clock, User } from "lucide-react";
import { Card, CardBody } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { useAuth } from "../../context/AuthContext";
import { CollaborationRequest, User as UserType } from "../../types";
import api from "../../services/api";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";

type FilterTab = "all" | "pending" | "accepted" | "rejected";

export const CollaborationPage: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [users, setUsers] = useState<Record<string, UserType>>({});
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      if (user) {
        try {
          const res = await api.get("/collaboration");
          setRequests(res.data);

          // Fetch user details for all participants
          const userIds = new Set<string>();
          res.data.forEach((req: CollaborationRequest) => {
            userIds.add(req.investorId);
            userIds.add(req.entrepreneurId);
          });

          const userPromises = Array.from(userIds).map((id) =>
            api.get(`/users/${id}`),
          );
          const userResponses = await Promise.all(userPromises);

          const usersMap: Record<string, UserType> = {};
          userResponses.forEach((response) => {
            usersMap[response.data.id] = response.data;
          });
          setUsers(usersMap);
        } catch (error) {
          console.error("Failed to fetch requests:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchRequests();
  }, [user]);

  const handleStatusUpdate = async (
    requestId: string,
    status: "accepted" | "rejected",
  ) => {
    try {
      await api.put(`/collaboration/${requestId}/status`, { status });
      setRequests((prev) =>
        prev.map((req) => (req.id === requestId ? { ...req, status } : req)),
      );
      toast.success(`Request ${status}`);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update request");
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (activeFilter === "all") return true;
    return req.status === activeFilter;
  });

  const isInvestor = user?.role === "investor";
  const getOtherUser = (req: CollaborationRequest) => {
    const userId = isInvestor ? req.entrepreneurId : req.investorId;
    return users[userId];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isInvestor
            ? "Collaboration Requests Sent"
            : "Collaboration Requests Received"}
        </h1>
        <p className="text-gray-600">
          {isInvestor
            ? "Track your collaboration requests to startups"
            : "Manage incoming collaboration requests from investors"}
        </p>
      </div>

      {/* Filter tabs */}
      <Card>
        <CardBody className="p-3">
          <div className="flex gap-2">
            <Button
              variant={activeFilter === "all" ? "primary" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("all")}
            >
              All ({requests.length})
            </Button>
            <Button
              variant={activeFilter === "pending" ? "primary" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("pending")}
              leftIcon={<Clock size={14} />}
            >
              Pending ({requests.filter((r) => r.status === "pending").length})
            </Button>
            <Button
              variant={activeFilter === "accepted" ? "primary" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("accepted")}
              leftIcon={<CheckCircle size={14} />}
            >
              Accepted ({requests.filter((r) => r.status === "accepted").length}
              )
            </Button>
            <Button
              variant={activeFilter === "rejected" ? "primary" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("rejected")}
              leftIcon={<XCircle size={14} />}
            >
              Rejected ({requests.filter((r) => r.status === "rejected").length}
              )
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Requests list */}
      <div className="space-y-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => {
            const otherUser = getOtherUser(request);
            return (
              <Card key={request.id}>
                <CardBody className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <Avatar
                        src={otherUser?.avatarUrl}
                        alt={otherUser?.name || "User"}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            to={`/profile/${isInvestor ? "entrepreneur" : "investor"}/${otherUser?.id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                          >
                            {otherUser?.name || "Unknown"}
                          </Link>
                          {request.status === "pending" && (
                            <Badge variant="warning" size="sm" rounded>
                              Pending
                            </Badge>
                          )}
                          {request.status === "accepted" && (
                            <Badge variant="success" size="sm" rounded>
                              Accepted
                            </Badge>
                          )}
                          {request.status === "rejected" && (
                            <Badge variant="error" size="sm" rounded>
                              Rejected
                            </Badge>
                          )}
                        </div>

                        {!isInvestor && otherUser?.startupName && (
                          <p className="text-sm text-gray-500 mb-2">
                            {otherUser.startupName}
                          </p>
                        )}
                        {isInvestor && otherUser?.startupName && (
                          <p className="text-sm text-gray-500 mb-2">
                            {otherUser.startupName}
                          </p>
                        )}

                        <p className="text-sm text-gray-700 mb-3">
                          {request.message}
                        </p>

                        <p className="text-xs text-gray-500">
                          Sent{" "}
                          {format(
                            parseISO(request.createdAt),
                            "MMM d, yyyy • h:mm a",
                          )}
                        </p>
                      </div>
                    </div>

                    {!isInvestor && request.status === "pending" && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<CheckCircle size={16} />}
                          onClick={() =>
                            handleStatusUpdate(request.id, "accepted")
                          }
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<XCircle size={16} />}
                          onClick={() =>
                            handleStatusUpdate(request.id, "rejected")
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    )}

                    {isInvestor && request.status === "accepted" && (
                      <Link to={`/chat/${request.entrepreneurId}`}>
                        <Button variant="primary" size="sm">
                          Message
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4 text-gray-400">
              {isInvestor ? <Send size={24} /> : <User size={24} />}
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {activeFilter === "all"
                ? "No requests yet"
                : `No ${activeFilter} requests`}
            </h3>
            <p className="text-gray-500 mt-1">
              {isInvestor
                ? "Start by browsing startups and sending collaboration requests."
                : "Investors will appear here when they request to collaborate with you."}
            </p>
            {isInvestor && (
              <Link to="/entrepreneurs">
                <Button variant="outline" className="mt-6">
                  Browse Startups
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
