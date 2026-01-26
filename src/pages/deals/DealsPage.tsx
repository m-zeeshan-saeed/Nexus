import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  X,
} from "lucide-react";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { useAuth } from "../../context/AuthContext";
import { Deal, User as UserType } from "../../types";
import dealService from "../../services/dealService";
import api from "../../services/api";
import toast from "react-hot-toast";

export const DealsPage: React.FC = () => {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [entrepreneurs, setEntrepreneurs] = useState<Record<string, UserType>>(
    {},
  );
  const [allEntrepreneurs, setAllEntrepreneurs] = useState<UserType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New deal form state
  const [newDeal, setNewDeal] = useState({
    entrepreneurId: "",
    amount: "",
    equity: "",
    stage: "Seed",
    status: "Due Diligence",
    notes: "",
  });

  const statuses = [
    "Due Diligence",
    "Term Sheet",
    "Negotiation",
    "Closed",
    "Passed",
  ];

  useEffect(() => {
    const fetchDeals = async () => {
      if (user) {
        try {
          const dealsData = await dealService.getDeals();
          setDeals(dealsData);

          // Fetch entrepreneur details
          const entrepreneurIds = new Set(
            dealsData.map((d) => d.entrepreneurId),
          );
          const entrepreneurPromises = Array.from(entrepreneurIds).map((id) =>
            api.get(`/users/${id}`),
          );
          const entrepreneurResponses = await Promise.all(entrepreneurPromises);

          const entrepreneursMap: Record<string, UserType> = {};
          entrepreneurResponses.forEach((response) => {
            entrepreneursMap[response.data.id] = response.data;
          });
          setEntrepreneurs(entrepreneursMap);

          // Fetch all entrepreneurs for dropdown
          const allEntrepreneursRes = await api.get("/directory/entrepreneurs");
          setAllEntrepreneurs(allEntrepreneursRes.data);
        } catch (error) {
          console.error("Failed to fetch deals:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchDeals();
  }, [user]);

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const createdDeal = await dealService.createDeal(newDeal);
      setDeals((prev) => [createdDeal, ...prev]);

      // Fetch entrepreneur details
      const entrepreneurRes = await api.get(`/users/${newDeal.entrepreneurId}`);
      setEntrepreneurs((prev) => ({
        ...prev,
        [newDeal.entrepreneurId]: entrepreneurRes.data,
      }));

      toast.success("Deal created successfully");
      setShowAddModal(false);
      setNewDeal({
        entrepreneurId: "",
        amount: "",
        equity: "",
        stage: "Seed",
        status: "Due Diligence",
        notes: "",
      });
    } catch (error) {
      console.error("Failed to create deal:", error);
      toast.error("Failed to create deal");
    }
  };

  const toggleStatus = (status: string) => {
    setSelectedStatus((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Due Diligence":
        return "primary";
      case "Term Sheet":
        return "secondary";
      case "Negotiation":
        return "accent";
      case "Closed":
        return "success";
      case "Passed":
        return "error";
      default:
        return "gray";
    }
  };

  const filteredDeals = deals.filter((deal) => {
    const entrepreneur = entrepreneurs[deal.entrepreneurId];
    const matchesSearch =
      searchQuery === "" ||
      entrepreneur?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entrepreneur?.startupName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      entrepreneur?.industry?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatus.length === 0 || selectedStatus.includes(deal.status);

    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalInvestment = deals
    .filter((d) => d.status === "Closed")
    .reduce((sum, d) => {
      const amount = parseFloat(d.amount.replace(/[$,M]/g, ""));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

  const activeDeals = deals.filter(
    (d) => d.status !== "Closed" && d.status !== "Passed",
  ).length;

  const portfolioCompanies = deals.filter((d) => d.status === "Closed").length;

  const closedThisMonth = deals.filter((d) => {
    if (d.status !== "Closed") return false;
    const dealDate = new Date(d.lastActivity);
    const now = new Date();
    return (
      dealDate.getMonth() === now.getMonth() &&
      dealDate.getFullYear() === now.getFullYear()
    );
  }).length;

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
          <h1 className="text-2xl font-bold text-gray-900">Investment Deals</h1>
          <p className="text-gray-600">
            Track and manage your investment pipeline
          </p>
        </div>

        <Button onClick={() => setShowAddModal(true)}>Add Deal</Button>
      </div>

      {/* Add Deal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Add New Deal
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Startup *
                </label>
                <select
                  required
                  value={newDeal.entrepreneurId}
                  onChange={(e) =>
                    setNewDeal({ ...newDeal, entrepreneurId: e.target.value })
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="">Choose a startup...</option>
                  {allEntrepreneurs.map((entrepreneur) => (
                    <option key={entrepreneur.id} value={entrepreneur.id}>
                      {entrepreneur.startupName} - {entrepreneur.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Investment Amount *
                  </label>
                  <Input
                    required
                    placeholder="e.g., $1.5M"
                    value={newDeal.amount}
                    onChange={(e) =>
                      setNewDeal({ ...newDeal, amount: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equity%
                  </label>
                  <Input
                    required
                    placeholder="e.g., 15%"
                    value={newDeal.equity}
                    onChange={(e) =>
                      setNewDeal({ ...newDeal, equity: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Funding Stage *
                  </label>
                  <select
                    required
                    value={newDeal.stage}
                    onChange={(e) =>
                      setNewDeal({ ...newDeal, stage: e.target.value })
                    }
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="Pre-seed">Pre-seed</option>
                    <option value="Seed">Seed</option>
                    <option value="Series A">Series A</option>
                    <option value="Series B">Series B</option>
                    <option value="Series C+">Series C+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deal Status
                  </label>
                  <select
                    value={newDeal.status}
                    onChange={(e) =>
                      setNewDeal({ ...newDeal, status: e.target.value })
                    }
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="Due Diligence">Due Diligence</option>
                    <option value="Term Sheet">Term Sheet</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Closed">Closed</option>
                    <option value="Passed">Passed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Optional notes about this deal..."
                  value={newDeal.notes}
                  onChange={(e) =>
                    setNewDeal({ ...newDeal, notes: e.target.value })
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Deal</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg mr-3">
                <DollarSign size={20} className="text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Investment</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${totalInvestment.toFixed(1)}M
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-lg mr-3">
                <TrendingUp size={20} className="text-secondary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Deals</p>
                <p className="text-lg font-semibold text-gray-900">
                  {activeDeals}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-lg mr-3">
                <Users size={20} className="text-accent-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Portfolio Companies</p>
                <p className="text-lg font-semibold text-gray-900">
                  {portfolioCompanies}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-success-100 rounded-lg mr-3">
                <Calendar size={20} className="text-success-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Closed This Month</p>
                <p className="text-lg font-semibold text-gray-900">
                  {closedThisMonth}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <Input
            placeholder="Search deals by startup name or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startAdornment={<Search size={18} />}
            fullWidth
          />
        </div>

        <div className="w-full md:w-1/3">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <Badge
                  key={status}
                  variant={
                    selectedStatus.includes(status)
                      ? getStatusColor(status)
                      : "gray"
                  }
                  className="cursor-pointer"
                  onClick={() => toggleStatus(status)}
                >
                  {status}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deals table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">All Deals</h2>
        </CardHeader>
        <CardBody>
          {filteredDeals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Startup
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Activity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDeals.map((deal) => {
                    const entrepreneur = entrepreneurs[deal.entrepreneurId];
                    return (
                      <tr key={deal.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar
                              src={entrepreneur?.avatarUrl}
                              alt={entrepreneur?.name || "Startup"}
                              size="sm"
                              className="flex-shrink-0"
                            />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {entrepreneur?.startupName || "Unknown"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {entrepreneur?.industry || "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {deal.amount}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {deal.equity}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getStatusColor(deal.status)}>
                            {deal.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {deal.stage}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(deal.lastActivity).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            to={`/profile/entrepreneur/${deal.entrepreneurId}`}
                          >
                            <Button variant="outline" size="sm">
                              View Profile
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4 text-gray-400">
                <DollarSign size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No deals yet
              </h3>
              <p className="text-gray-500 mt-1">
                Start tracking your investment pipeline by adding deals
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
