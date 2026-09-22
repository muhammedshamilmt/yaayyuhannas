export function Tickets() {
  const ticketTypes = [
    {
      name: "General Admission",
      price: "$199",
      originalPrice: "$249",
      features: [
        "3-day festival access",
        "Access to all stages",
        "Food court access",
        "Merchandise discounts",
      ],
      popular: false,
    },
    {
      name: "VIP Experience",
      price: "$399",
      originalPrice: "$499",
      features: [
        "Everything in General Admission",
        "VIP viewing areas",
        "Complimentary drinks",
        "VIP restrooms",
        "Meet & greet opportunities",
        "Exclusive merchandise",
      ],
      popular: true,
    },
    {
      name: "Platinum Package",
      price: "$799",
      originalPrice: "$999",
      features: [
        "Everything in VIP",
        "Backstage access",
        "Artist meet & greets",
        "Premium catering",
        "Dedicated concierge",
        "Luxury transportation",
        "Hotel accommodation",
      ],
      popular: false,
    },
  ];

  return (
    <section id="tickets" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Get Your Tickets
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Choose the perfect ticket package for your festival experience
          </p>
          <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-red-300 font-semibold">⚡ Early Bird Special - Save up to $100!</p>
            <p className="text-red-200 text-sm">Limited time offer ends March 1st</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {ticketTypes.map((ticket, index) => (
            <div
              key={index}
              className={`relative bg-white/10 backdrop-blur-sm border rounded-2xl p-8 hover:scale-105 transition-transform duration-300 ${
                ticket.popular
                  ? "border-purple-500/50 ring-2 ring-purple-500/30"
                  : "border-white/10"
              }`}
            >
              {ticket.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">{ticket.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">{ticket.price}</span>
                  <span className="text-gray-400 line-through ml-2">{ticket.originalPrice}</span>
                </div>
                <p className="text-gray-300">per person</p>
              </div>

              <ul className="space-y-4 mb-8">
                {ticket.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-4 rounded-lg font-semibold transition-all duration-300 ${
                  ticket.popular
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    : "bg-white/20 hover:bg-white/30 text-white border border-white/30"
                }`}
              >
                Select {ticket.name}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-6 max-w-2xl mx-auto mb-8">
            <h4 className="text-yellow-300 font-semibold mb-2">🎫 Group Discounts Available</h4>
            <p className="text-yellow-200">
              Save 15% when you buy 4+ tickets together. Perfect for friends and families!
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-2xl mb-2">🔒</div>
              <h4 className="text-white font-semibold mb-2">Secure Payment</h4>
              <p className="text-gray-300 text-sm">256-bit SSL encryption</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-2xl mb-2">↩️</div>
              <h4 className="text-white font-semibold mb-2">Easy Refunds</h4>
              <p className="text-gray-300 text-sm">Full refund up to 30 days</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-2xl mb-2">📱</div>
              <h4 className="text-white font-semibold mb-2">Mobile Tickets</h4>
              <p className="text-gray-300 text-sm">No printing required</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}