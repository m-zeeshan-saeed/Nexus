import React, { useState, useEffect } from "react";
import { X, DollarSign } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import paymentService from "../../services/paymentService";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const BaseModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, extra?: string) => Promise<void> | void;
  isLoading?: boolean;
}

export const DepositModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Credit Card");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(Number(amount), method);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Deposit Funds">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          startAdornment={<DollarSign size={16} />}
          fullWidth
        />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Payment Method
          </label>
          <select
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option>Credit Card</option>
            <option>PayPal</option>
            <option>Bank Transfer</option>
          </select>
        </div>
        <div className="pt-2 flex justify-end space-x-3">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isLoading}
            disabled={!amount || Number(amount) <= 0}
          >
            Confirm Deposit
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export const WithdrawModal: React.FC<
  PaymentModalProps & { balance: number }
> = ({ isOpen, onClose, onConfirm, isLoading, balance }) => {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Bank Account");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(Number(amount), method);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Withdraw Funds">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">Available Balance</span>
          <span className="font-bold text-gray-900">
            ${balance.toLocaleString()}
          </span>
        </div>
        <Input
          label="Amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          startAdornment={<DollarSign size={16} />}
          fullWidth
          error={Number(amount) > balance ? "Insufficient funds" : ""}
        />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Withdraw to
          </label>
          <select
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option>Bank Account</option>
            <option>PayPal</option>
            <option>Debit Card</option>
          </select>
        </div>
        <div className="pt-2 flex justify-end space-x-3">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isLoading}
            disabled={
              !amount || Number(amount) <= 0 || Number(amount) > balance
            }
          >
            Confirm Withdrawal
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export const TransferModal: React.FC<
  PaymentModalProps & { balance: number }
> = ({ isOpen, onClose, onConfirm, isLoading, balance }) => {
  const [amount, setAmount] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [description, setDescription] = useState("");
  const [connections, setConnections] = useState<import("../../types").User[]>(
    [],
  );
  const [isFetchingConnections, setIsFetchingConnections] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchConnections = async () => {
        setIsFetchingConnections(true);
        try {
          const data = await paymentService.getConnections();
          setConnections(data);
        } catch (error) {
          console.error("Failed to fetch connections:", error);
        } finally {
          setIsFetchingConnections(false);
        }
      };
      fetchConnections();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(Number(amount), JSON.stringify({ recipientId, description }));
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Transfer Funds">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">Available Balance</span>
          <span className="font-bold text-gray-900">
            ${balance.toLocaleString()}
          </span>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Send To Partner
          </label>
          {isFetchingConnections ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
          ) : connections.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {connections.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setRecipientId(user.id)}
                  className={`flex items-center p-2 rounded-lg border transition-all text-left ${
                    recipientId === user.id
                      ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500"
                      : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs mr-2 flex-shrink-0">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate lowercase">
                      {user.role}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-xs text-gray-500">
                No connected partners found.
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Establish collaborations to enable transfers.
              </p>
            </div>
          )}
        </div>

        <Input
          label="Amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          startAdornment={<DollarSign size={16} />}
          fullWidth
          error={Number(amount) > balance ? "Insufficient funds" : ""}
        />

        <Input
          label="Description (Optional)"
          placeholder="What's this for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
        />

        <div className="pt-2 flex justify-end space-x-3">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isLoading}
            disabled={
              !amount ||
              Number(amount) <= 0 ||
              Number(amount) > balance ||
              !recipientId
            }
          >
            Send Transfer
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};
