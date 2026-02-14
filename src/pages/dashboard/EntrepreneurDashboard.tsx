import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Bell,
  Calendar,
  MessageCircle,
  AlertCircle,
  PlusCircle,
  Clock,
  MapPin,
  FileText,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { CollaborationRequestCard } from "../../components/collaboration/CollaborationRequestCard";
import { InvestorCard } from "../../components/investor/InvestorCard";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import dashboardService, {
  DashboardSummary,
} from "../../services/dashboardService";
import documentService from "../../services/documentService";
import { format, parseISO } from "date-fns";
import { WalletCard } from "../../components/dashboard/WalletCard";
import { TransactionHistory } from "../../components/dashboard/TransactionHistory";
import {
  DepositModal,
  WithdrawModal,
  TransferModal,
} from "../../components/dashboard/PaymentModals";
import paymentService from "../../services/paymentService";
import toast from "react-hot-toast";
import {
  CollaborationRequest,
  Investor,
  Meeting,
  Document,
  Transaction,
} from "../../types";

export const EntrepreneurDashboard: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [collaborationRequests, setCollaborationRequests] = useState<
    CollaborationRequest[]
  >([]);
  const [recommendedInvestors, setRecommendedInvestors] = useState<Investor[]>(
    [],
  );
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  // Modal states
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (user) {
        setIsLoading(true);
        try {
          // Fetch summary stats
          const summaryData = await dashboardService.getSummary();
          setSummary(summaryData);

          // Fetch collaboration requests from API
          const requestsRes = await api.get("/collaboration");
          setCollaborationRequests(requestsRes.data);

          // Fetch investors for recommendation from API
          const investorsRes = await api.get("/directory/investors");
          setRecommendedInvestors(investorsRes.data.slice(0, 3));

          // Fetch recent documents
          const docsRes = await documentService.getDocuments();
          setRecentDocuments(docsRes.slice(0, 4));

          // Fetch wallet data
          const [balanceData, transactionsData] = await Promise.all([
            paymentService.getBalance(),
            paymentService.getTransactions(),
          ]);
          setBalance(balanceData);
          setTransactions(transactionsData);
        } catch (error) {
          console.error("Failed to fetch dashboard data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchDashboardData();
    window.addEventListener("payment-updated", fetchDashboardData);
    return () =>
      window.removeEventListener("payment-updated", fetchDashboardData);
  }, [user]);

  const handleDeposit = async (amount: number, method?: string) => {
    setIsPaymentLoading(true);
    try {
      const res = await paymentService.deposit(amount, method);
      setBalance(res.balance);
      setTransactions([res.transaction, ...transactions]);
      toast.success(res.message);
      setIsDepositOpen(false);
    } catch {
      toast.error("Deposit failed");
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleWithdraw = async (amount: number, method?: string) => {
    setIsPaymentLoading(true);
    try {
      const res = await paymentService.withdraw(amount, method);
      setBalance(res.balance);
      setTransactions([res.transaction, ...transactions]);
      toast.success(res.message);
      setIsWithdrawOpen(false);
    } catch {
      toast.error("Withdrawal failed");
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleTransfer = async (amount: number, data?: string) => {
    try {
      if (!data) return;
      setIsPaymentLoading(true);
      const { recipientId, description } = JSON.parse(data);
      const res = await paymentService.transfer(
        recipientId,
        amount,
        description,
      );
      setBalance(res.balance);
      setTransactions([res.transaction, ...transactions]);
      toast.success(res.message);
      setIsTransferOpen(false);
    } catch {
      toast.error("Transfer failed");
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleRequestStatusUpdate = async (
    requestId: string,
    status: "accepted" | "rejected",
  ) => {
    try {
      await api.put(`/collaboration/${requestId}/status`, { status });
      setCollaborationRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === requestId ? { ...req, status } : req,
        ),
      );
      // Refresh summary to update counts
      const summaryData = await dashboardService.getSummary();
      setSummary(summaryData);
    } catch (error) {
      console.error("Failed to update request status:", error);
    }
  };

  if (!user) return null;

  const pendingRequests = collaborationRequests.filter(
    (req) => req.status === "pending",
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user.name}
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your startup today
          </p>
        </div>

        <Link to="/investors">
          <Button leftIcon={<PlusCircle size={18} />}>Find Investors</Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary-50 border border-primary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full mr-4">
                <Bell size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700">
                  Pending Requests
                </p>
                <h3 className="text-xl font-semibold text-primary-900">
                  {summary?.pendingRequests || 0}
                </h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-secondary-50 border border-secondary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-full mr-4">
                <Users size={20} className="text-secondary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">
                  Total Connections
                </p>
                <h3 className="text-xl font-semibold text-secondary-900">
                  {summary?.totalConnections || 0}
                </h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-accent-50 border border-accent-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-full mr-4">
                <Calendar size={20} className="text-accent-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-accent-700">
                  Upcoming Meetings
                </p>
                <h3 className="text-xl font-semibold text-accent-900">
                  {summary?.upcomingMeetings || 0}
                </h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-success-50 border border-success-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full mr-4">
                <MessageCircle size={20} className="text-success-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-success-700">
                  New Messages
                </p>
                <h3 className="text-xl font-semibold text-success-900">
                  {summary?.unreadMessages || 0}
                </h3>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <WalletCard
            balance={balance}
            onDeposit={() => setIsDepositOpen(true)}
            onWithdraw={() => setIsWithdrawOpen(true)}
            onTransfer={() => setIsTransferOpen(true)}
          />
        </div>
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Recent Transactions
            </h2>
            <Link
              to="/transactions"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              View All
            </Link>
          </div>
          <TransactionHistory transactions={transactions} loading={isLoading} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Collaboration Requests
              </h2>
              <Badge variant="primary">{pendingRequests.length} pending</Badge>
            </CardHeader>

            <CardBody>
              {collaborationRequests.length > 0 ? (
                <div className="space-y-4">
                  {collaborationRequests.map((request) => (
                    <CollaborationRequestCard
                      key={request.id}
                      request={request}
                      onStatusUpdate={handleRequestStatusUpdate}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <AlertCircle size={24} className="text-gray-500" />
                  </div>
                  <p className="text-gray-600">No collaboration requests yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    When investors are interested in your startup, their
                    requests will appear here
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Upcoming Meetings List */}
          {summary?.meetings && summary.meetings.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">
                  Upcoming Meetings
                </h2>
              </CardHeader>
              <CardBody className="p-0">
                <div className="divide-y divide-gray-200">
                  {summary.meetings.map((meeting: Meeting) => (
                    <div
                      key={meeting.id}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-primary-100 text-primary-700 rounded-md">
                          <span className="text-xs font-bold uppercase">
                            {format(parseISO(meeting.startTime), "MMM")}
                          </span>
                          <span className="text-lg font-bold leading-none">
                            {format(parseISO(meeting.startTime), "d")}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">
                            {meeting.title}
                          </h4>
                          <div className="flex flex-col sm:flex-row sm:space-x-4 mt-1 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Clock size={12} className="mr-1" />
                              {format(parseISO(meeting.startTime), "h:mm a")}
                            </span>
                            <span className="flex items-center">
                              <MapPin size={12} className="mr-1" />
                              {meeting.location}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link to="/meetings">
                        <Button variant="ghost" size="sm">
                          Details
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar - right side */}
        <div className="space-y-4">
          {/* Recent Documents */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Recent Documents
              </h2>
              <Link
                to="/documents"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                View all
              </Link>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-gray-100">
                {recentDocuments.length > 0 ? (
                  recentDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 flex items-center hover:bg-gray-50 transition-colors"
                    >
                      <div className="p-2 bg-primary-50 rounded-md mr-3">
                        <FileText size={18} className="text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {doc.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500 uppercase">
                            {doc.type}
                          </span>
                          {doc.shared && (
                            <Badge variant="primary" size="sm" rounded>
                              Public
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-sm text-gray-500">
                      No documents uploaded yet
                    </p>
                    <Link to="/documents" className="mt-2 inline-block">
                      <Button variant="outline" size="sm">
                        Upload Now
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Recommended Investors
              </h2>
              <Link
                to="/investors"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                View all
              </Link>
            </CardHeader>

            <CardBody className="space-y-4">
              {recommendedInvestors.map((investor) => (
                <InvestorCard
                  key={investor.id}
                  investor={investor}
                  showActions={false}
                />
              ))}
            </CardBody>
          </Card>
        </div>
      </div>

      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onConfirm={handleDeposit}
        isLoading={isPaymentLoading}
      />
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onConfirm={handleWithdraw}
        balance={balance}
        isLoading={isPaymentLoading}
      />
      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        onConfirm={handleTransfer}
        balance={balance}
        isLoading={isPaymentLoading}
      />
    </div>
  );
};
