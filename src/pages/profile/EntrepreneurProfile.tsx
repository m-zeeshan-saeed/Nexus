import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MessageCircle,
  Users,
  Calendar,
  Building2,
  MapPin,
  UserCircle,
  FileText,
  DollarSign,
  Send,
  CalendarDays,
} from "lucide-react";
import toast from "react-hot-toast";
import { ScheduleMeetingModal } from "../../components/meetings/ScheduleMeetingModal";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { useAuth } from "../../context/AuthContext";
import { Entrepreneur, CollaborationRequest } from "../../types";
import api from "../../services/api";
import { useSocket } from "../../context/SocketContext";

export const EntrepreneurProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { userStatuses } = useSocket();
  const { user: currentUser } = useAuth();
  const [entrepreneur, setEntrepreneur] = useState<Entrepreneur | null>(null);
  const [collaborationRequests, setCollaborationRequests] = useState<
    CollaborationRequest[]
  >([]);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const res = await api.get(`/users/${id}`);
        setEntrepreneur(res.data);

        // If current user is an investor, check for collaboration requests
        if (currentUser?.role === "investor") {
          const requestsRes = await api.get("/collaboration");
          setCollaborationRequests(requestsRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch entrepreneur profile:", error);
        toast.error("Failed to load profile data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [id, currentUser]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!entrepreneur || entrepreneur.role !== "entrepreneur") {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">
          Entrepreneur not found
        </h2>
        <p className="text-gray-600 mt-2">
          The entrepreneur profile you're looking for doesn't exist or has been
          removed.
        </p>
        <Link to="/dashboard/investor">
          <Button variant="outline" className="mt-4">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const isCurrentUser = currentUser?.id === entrepreneur.id;
  const isInvestor = currentUser?.role === "investor";

  const collaborationRequest =
    isInvestor && id
      ? collaborationRequests.find(
          (req) =>
            req.entrepreneurId === id && req.investorId === currentUser.id,
        )
      : null;

  const hasRequestedCollaboration = !!collaborationRequest;
  const isCollaborationAccepted = collaborationRequest?.status === "accepted";

  const handleSendRequest = async () => {
    console.log("[DEBUG] handleSendRequest called", {
      isInvestor,
      currentUserRole: currentUser?.role,
      targetId: id,
    });

    if (!currentUser) {
      toast.error("Please log in to request collaboration");
      return;
    }

    if (!isInvestor) {
      toast.error(
        "Only investors can request collaboration with entrepreneurs",
      );
      return;
    }

    if (!id) {
      toast.error("Invalid entrepreneur profile");
      return;
    }

    try {
      const loadingToast = toast.loading("Sending request...");
      console.log("[DEBUG] POST /collaboration payload:", {
        entrepreneurId: id,
      });

      const res = await api.post("/collaboration", {
        entrepreneurId: id,
        message: `I'm interested in learning more about ${entrepreneur.startupName} and would like to explore potential investment opportunities.`,
      });

      console.log("[DEBUG] POST /collaboration response:", res.data);
      toast.success("Collaboration request sent!", { id: loadingToast });

      // Refresh collaboration requests
      const requestsRes = await api.get("/collaboration");
      console.log(
        "[DEBUG] GET /collaboration refreshed count:",
        requestsRes.data.length,
      );
      setCollaborationRequests(requestsRes.data);
    } catch (error: any) {
      console.error("[DEBUG] Collaboration request failed:", error);
      const message = error.response?.data?.message || "Failed to send request";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile header */}
      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar
              src={entrepreneur.avatarUrl}
              alt={entrepreneur.name}
              size="xl"
              status={userStatuses[entrepreneur.id]?.status || "offline"}
              className="mx-auto sm:mx-0"
            />

            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">
                {entrepreneur.name}
              </h1>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                <Building2 size={16} className="mr-1" />
                Founder at {entrepreneur.startupName}
              </p>

              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                <Badge variant="primary">{entrepreneur.industry}</Badge>
                <Badge variant="gray">
                  <MapPin size={14} className="mr-1" />
                  {entrepreneur.location}
                </Badge>
                {entrepreneur.foundedYear && (
                  <Badge variant="accent">
                    <Calendar size={14} className="mr-1" />
                    Founded {entrepreneur.foundedYear}
                  </Badge>
                )}
                {entrepreneur.teamSize && (
                  <Badge variant="secondary">
                    <Users size={14} className="mr-1" />
                    {entrepreneur.teamSize} team members
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            {!isCurrentUser && (
              <>
                <Link to={`/chat/${entrepreneur.id}`}>
                  <Button
                    variant="outline"
                    leftIcon={<MessageCircle size={18} />}
                  >
                    Message
                  </Button>
                </Link>

                {isInvestor && (
                  <>
                    <Button
                      variant="outline"
                      leftIcon={<CalendarDays size={18} />}
                      onClick={() => setIsMeetingModalOpen(true)}
                      disabled={!isCollaborationAccepted}
                      title={
                        !isCollaborationAccepted
                          ? "Collaboration must be accepted to schedule a meeting"
                          : ""
                      }
                    >
                      Schedule Meeting
                    </Button>
                    <Button
                      leftIcon={<Send size={18} />}
                      disabled={hasRequestedCollaboration}
                      onClick={handleSendRequest}
                    >
                      {hasRequestedCollaboration
                        ? "Request Sent"
                        : "Request Collaboration"}
                    </Button>
                  </>
                )}
              </>
            )}

            {isCurrentUser && (
              <Link to="/settings">
                <Button variant="outline" leftIcon={<UserCircle size={18} />}>
                  Edit Profile
                </Button>
              </Link>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - left side */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">About</h2>
            </CardHeader>
            <CardBody>
              <p className="text-gray-700">
                {entrepreneur.bio || "No bio provided."}
              </p>
            </CardBody>
          </Card>

          {/* Startup Description */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">
                Startup Overview
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-medium text-gray-900">
                    Pitch Summary
                  </h3>
                  <p className="text-gray-700 mt-1">
                    {entrepreneur.pitchSummary || "No pitch summary provided."}
                  </p>
                </div>

                <div>
                  <h3 className="text-md font-medium text-gray-900">
                    Market Opportunity
                  </h3>
                  <p className="text-gray-700 mt-1">
                    The {entrepreneur.industry} market is experiencing
                    significant growth. Our solution addresses key pain points
                    in this expanding market.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Team */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Team</h2>
              <span className="text-sm text-gray-500">
                {entrepreneur.teamSize || 1} members
              </span>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center p-3 border border-gray-200 rounded-md">
                  <Avatar
                    src={entrepreneur.avatarUrl}
                    alt={entrepreneur.name}
                    size="md"
                    className="mr-3"
                  />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {entrepreneur.name}
                    </h3>
                    <p className="text-xs text-gray-500">Founder & CEO</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar - right side */}
        <div className="space-y-6">
          {/* Funding Details */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Funding</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Current Round</span>
                  <div className="flex items-center mt-1">
                    <DollarSign size={18} className="text-accent-600 mr-1" />
                    <p className="text-lg font-semibold text-gray-900">
                      {entrepreneur.fundingNeeded || "Undisclosed"}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Documents</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                  <div className="p-2 bg-primary-50 rounded-md mr-3">
                    <FileText size={18} className="text-primary-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      Pitch Deck
                    </h3>
                    <p className="text-xs text-gray-500">
                      Request access to view
                    </p>
                  </div>
                </div>
              </div>

              {!isCurrentUser && isInvestor && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Request access to detailed documents and financials by
                    sending a collaboration request.
                  </p>

                  <Button
                    className="mt-3 w-full"
                    disabled={hasRequestedCollaboration}
                    onClick={handleSendRequest}
                  >
                    {hasRequestedCollaboration
                      ? "Request Sent"
                      : "Request Collaboration"}
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {currentUser?.id && id && (
        <ScheduleMeetingModal
          isOpen={isMeetingModalOpen}
          onClose={() => setIsMeetingModalOpen(false)}
          investorId={currentUser.id}
          entrepreneurId={id}
        />
      )}
    </div>
  );
};
