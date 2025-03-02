import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUserPantry } from "../../redux/actions/productActions";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import "./CalendarPage.css";

const CalendarPage = () => {
  const dispatch = useDispatch();
  const pantryItems = useSelector((state) => state.productState.products);
  const isAuthenticated = useSelector(
    (state) => !!state.userState.loginResult?.token,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState([]);

  // Fetch pantry items when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      setError(null);
      dispatch(getUserPantry())
        .then(() => setLoading(false))
        .catch((err) => {
          setError(err.message || "Failed to load pantry items");
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [dispatch, isAuthenticated]);

  // Helper function to parse date strings from API
  const parseDate = (dateStr) => {
    if (!dateStr) return null;

    // Handle different date formats
    // Format: "Sun, 02 Mar 2025 00:00:00 GMT"
    try {
      return new Date(dateStr);
    } catch (e) {
      console.error("Error parsing date:", dateStr, e);
      return null;
    }
  };

  // Convert pantry items to calendar events when pantryItems changes
  useEffect(() => {
    console.log("Pantry items for calendar:", pantryItems);

    if (pantryItems && pantryItems.length > 0) {
      const events = pantryItems
        .filter((item) => {
          const hasExpDate = !!item.expiration_date;
          if (!hasExpDate) {
            console.log("Item missing expiration date:", item);
          }
          return hasExpDate;
        })
        .map((item) => {
          const expDate = parseDate(item.expiration_date);

          if (!expDate) {
            console.log("Failed to parse expiration date for item:", item);
            return null;
          }

          const event = {
            title: `${item.productname} expires`,
            date: expDate.toISOString().split("T")[0], // Format: YYYY-MM-DD
            backgroundColor: getColorForDaysRemaining(expDate),
            extendedProps: {
              quantity: `${item.quantity} ${item.quantitytype || "items"}`,
              category: item.productcategory || "Other",
            },
          };

          console.log("Created calendar event:", event);
          return event;
        })
        .filter((event) => event !== null); // Remove any events that failed to parse

      console.log("Final calendar events:", events);
      setCalendarEvents(events);
    }
  }, [pantryItems]);

  // Helper function to determine color based on days until expiration
  const getColorForDaysRemaining = (expirationDate) => {
    if (!expirationDate) return "#6c757d"; // Default gray

    const today = new Date();
    const daysRemaining = Math.floor(
      (expirationDate - today) / (1000 * 60 * 60 * 24),
    );

    console.log("Days remaining:", daysRemaining, "for date:", expirationDate);

    if (daysRemaining < 0) return "#dc3545"; // Expired - red
    if (daysRemaining < 3) return "#fd7e14"; // Expiring soon - orange
    if (daysRemaining < 7) return "#ffc107"; // Expiring this week - yellow
    return "#28a745"; // Not expiring soon - green
  };

  // Custom event render to show more details
  const renderEventContent = (eventInfo) => {
    return (
      <div className="calendar-event">
        <b>{eventInfo.event.title}</b>
        <div className="event-details">
          {eventInfo.event.extendedProps.quantity}
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-container">
      <h1>Expiration Calendar</h1>
      <p>Track when your food items will expire</p>

      {loading ? (
        <div className="loading">Loading your pantry items...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <div className="calendar-legend">
            <div className="legend-item">
              <span className="color-box expired"></span> Expired
            </div>
            <div className="legend-item">
              <span className="color-box expiring-soon"></span> Expiring in 3
              days
            </div>
            <div className="legend-item">
              <span className="color-box expiring-week"></span> Expiring in 7
              days
            </div>
            <div className="legend-item">
              <span className="color-box not-expiring"></span> Not expiring soon
            </div>
          </div>

          <div className="calendar-wrapper">
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              events={calendarEvents}
              eventContent={renderEventContent}
              height="auto"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,dayGridWeek",
              }}
            />
          </div>

          {calendarEvents.length === 0 && !loading && (
            <div className="no-items">
              <p>No items with expiration dates found in your pantry.</p>
              <p>Debug info: Found {pantryItems.length} pantry items total.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CalendarPage;
