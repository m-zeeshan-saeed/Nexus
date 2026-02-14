import React from "react";
import { format } from "date-fns";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Clock,
} from "lucide-react";
import { Transaction } from "../../types";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { Badge } from "../ui/Badge";

interface TransactionHistoryProps {
  transactions: Transaction[];
  loading?: boolean;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  loading = false,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="text-green-500" size={18} />;
      case "withdraw":
        return <ArrowUpRight className="text-red-500" size={18} />;
      case "transfer":
        return <ArrowRightLeft className="text-blue-500" size={18} />;
      default:
        return <Clock className="text-gray-500" size={18} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "failed":
        return "error";
      default:
        return "gray";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Transactions
          </h3>
          <Badge variant="gray">{transactions.length} total</Badge>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transactions yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((transaction) => {
                  const txKey = transaction.id || Math.random();
                  return (
                    <tr
                      key={txKey}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-gray-100 rounded-lg mr-3">
                            {getIcon(transaction.type)}
                          </div>
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {transaction.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 truncate max-w-xs">
                          {transaction.description}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-500">
                          {format(
                            new Date(transaction.createdAt),
                            "MMM d, yyyy • HH:mm",
                          )}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span
                          className={`text-sm font-bold ${
                            transaction.amount > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.amount > 0 ? "+" : "-"}
                          {Math.abs(transaction.amount).toLocaleString(
                            undefined,
                            {
                              style: "currency",
                              currency: "USD",
                            },
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Badge
                          variant={
                            getStatusColor(transaction.status) as
                              | "success"
                              | "warning"
                              | "error"
                              | "gray"
                          }
                          size="sm"
                        >
                          {transaction.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
