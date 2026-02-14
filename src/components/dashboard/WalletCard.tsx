import React from "react";
import { Wallet, Plus, ArrowUpRight, ArrowRight } from "lucide-react";
import { Card, CardBody } from "../ui/Card";
import { Button } from "../ui/Button";

interface WalletCardProps {
  balance: number;
  onDeposit: () => void;
  onWithdraw: () => void;
  onTransfer: () => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  balance,
  onDeposit,
  onWithdraw,
  onTransfer,
}) => {
  return (
    <Card className="bg-gradient-to-br from-primary-600 to-primary-800 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Wallet size={120} />
      </div>
      <CardBody className="relative z-10">
        <div className="flex items-center space-x-2 mb-4">
          <Wallet size={20} className="text-primary-100" />
          <h3 className="text-primary-100 font-medium">Virtual Wallet</h3>
        </div>

        <div className="mb-6">
          <p className="text-primary-100 text-sm mb-1 opacity-80">
            Total Balance
          </p>
          <h2 className="text-4xl font-bold">
            $
            {balance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={onDeposit}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            leftIcon={<Plus size={16} />}
          >
            Deposit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={onWithdraw}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            leftIcon={<ArrowUpRight size={16} />}
          >
            Withdraw
          </Button>
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={onTransfer}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            leftIcon={<ArrowRight size={16} />}
          >
            Transfer
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};
