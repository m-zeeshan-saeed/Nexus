import React, { useState, useEffect } from "react";
import {
  Search,
  Book,
  MessageCircle,
  Phone,
  Mail,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { useAuth } from "../../context/AuthContext";
import { SupportTicket } from "../../types";
import supportService from "../../services/supportService";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";

const faqs = [
  {
    question: "How do I connect with investors?",
    answer:
      "You can browse our investor directory and send connection requests. Once an investor accepts, you can start messaging them directly through our platform.",
  },
  {
    question: "What should I include in my startup profile?",
    answer:
      "Your startup profile should include a compelling pitch, funding needs, team information, market opportunity, and any traction or metrics that demonstrate your progress.",
  },
  {
    question: "How do I share documents securely?",
    answer:
      "You can upload documents to your secure document vault and selectively share them with connected investors. All documents are encrypted and access-controlled.",
  },
  {
    question: "What are collaboration requests?",
    answer:
      "Collaboration requests are formal expressions of interest from investors. They indicate that an investor wants to learn more about your startup and potentially discuss investment opportunities.",
  },
  {
    question: "How do I schedule a meeting with an investor?",
    answer:
      "Navigate to the Meetings page and click 'Schedule Meeting'. Select the investor, choose a time, and add meeting details. The investor will receive a notification.",
  },
  {
    question: "Can I track my investment deals?",
    answer:
      "Yes! Investors can use the Deals section to track their investment pipeline, including deal stage, amount, equity, and status updates.",
  },
];

export const HelpPage: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    message: "",
  });

  const contactFormRef = React.useRef<HTMLDivElement>(null);

  const scrollToContactForm = () => {
    contactFormRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name,
        email: user.email,
      }));
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const data = await supportService.getTickets();
      setTickets(data);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supportService.createTicket({
        name: formData.name,
        email: formData.email,
        subject: "Support Request",
        message: formData.message,
      });
      toast.success("Support ticket submitted successfully!");
      setFormData({ ...formData, message: "" });
      fetchTickets();
    } catch (error) {
      console.error("Failed to submit ticket:", error);
      toast.error("Failed to submit ticket. Please try again.");
    }
  };

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Clock size={16} className="text-warning-600" />;
      case "in-progress":
        return <MessageCircle size={16} className="text-primary-600" />;
      case "resolved":
        return <CheckCircle2 size={16} className="text-success-600" />;
      case "closed":
        return <XCircle size={16} className="text-gray-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "warning";
      case "in-progress":
        return "primary";
      case "resolved":
        return "success";
      case "closed":
        return "gray";
      default:
        return "gray";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-600">
          Find answers to common questions or get in touch with our support team
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl">
        <Input
          placeholder="Search help articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startAdornment={<Search size={18} />}
          fullWidth
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick links */}
        <Card>
          <CardBody className="text-center p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 rounded-lg mb-4">
              <Book size={24} className="text-primary-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-900">Documentation</h2>
            <p className="text-sm text-gray-600 mt-2">
              Browse our detailed documentation and guides
            </p>
            <Button
              variant="outline"
              className="mt-4"
              rightIcon={<ExternalLink size={16} />}
              onClick={() =>
                window.open("https://docs.businessnexus.com", "_blank")
              }
            >
              View Docs
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 rounded-lg mb-4">
              <MessageCircle size={24} className="text-primary-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-900">Live Chat</h2>
            <p className="text-sm text-gray-600 mt-2">
              Chat with our support team in real-time
            </p>
            <Button className="mt-4" onClick={scrollToContactForm}>
              Start Chat
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 rounded-lg mb-4">
              <Phone size={24} className="text-primary-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-900">Contact Us</h2>
            <p className="text-sm text-gray-600 mt-2">
              Get help via email or phone
            </p>
            <Button
              variant="outline"
              className="mt-4"
              leftIcon={<Mail size={16} />}
              onClick={scrollToContactForm}
            >
              Contact Support
            </Button>
          </CardBody>
        </Card>
      </div>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">
            Frequently Asked Questions
          </h2>
        </CardHeader>
        <CardBody>
          {filteredFaqs.length > 0 ? (
            <div className="space-y-6">
              {filteredFaqs.map((faq, index) => (
                <div
                  key={index}
                  className="border-b border-gray-200 last:border-0 pb-6 last:pb-0"
                >
                  <h3 className="text-base font-medium text-gray-900 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No results found for "{searchQuery}". Try different keywords.
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* My Tickets Section */}
      {user && tickets.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">My Tickets</h2>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-200">
              {tickets.slice(0, 5).map((ticket) => (
                <div key={ticket.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {ticket.subject}
                        </h3>
                        <Badge
                          variant={getStatusColor(ticket.status) as any}
                          size="sm"
                          rounded
                        >
                          <div className="flex items-center gap-1">
                            {getStatusIcon(ticket.status)}
                            <span className="capitalize">{ticket.status}</span>
                          </div>
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {ticket.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Created{" "}
                        {format(parseISO(ticket.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Contact form */}
      <Card ref={contactFormRef}>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">
            Still need help?
          </h2>
        </CardHeader>
        <CardBody>
          <form className="space-y-6 max-w-2xl" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Name"
                placeholder="Your name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />

              <Input
                label="Email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                rows={4}
                placeholder="How can we help you?"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                required
              ></textarea>
            </div>

            <div>
              <Button type="submit">Send Message</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};
