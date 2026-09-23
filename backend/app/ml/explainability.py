import datetime
from typing import Dict, Any, List
from backend.app.schemas.weather import WhyThisForecastResponse, ModelForecastDetail, LocationSchema

class ForecastExplainabilityEngine:
    """
    Generates transparent, mathematically grounded explanations for any blended forecast point.
    Discloses exact model inputs, weights, historical verification metrics, regime rules, and uncertainty.
    """

    @staticmethod
    def generate_explanation(
        location: LocationSchema,
        forecast_valid_time: datetime.datetime,
        lead_time_hours: int,
        season: str,
        weather_regime: str,
        regime_reasoning: str,
        variable: str,
        blended_value: float,
        unit: str,
        model_details: List[ModelForecastDetail],
        uncertainty_lower: float,
        uncertainty_upper: float,
        disagreement_spread: float,
        confidence_assessment: str,
        historical_validation_records: List[Dict[str, Any]],
        data_sources: List[Dict[str, Any]]
    ) -> WhyThisForecastResponse:
        
        # Format human-readable scientific summary without AI fluff
        top_model = max(model_details, key=lambda m: m.weight if m.weight is not None else 0.0) if model_details else None
        top_name = top_model.model_name if top_model else "N/A"
        top_wt = f"{round((top_model.weight or 0.0) * 100, 1)}%" if top_model else "0%"
        
        summary = (
            f"Blended {variable} forecast of {blended_value} {unit} for {location.name} at +{lead_time_hours}h lead time "
            f"under the '{weather_regime}' atmospheric regime. Model consensus demonstrates a spread of ±{disagreement_spread} {unit}. "
            f"Based on historical validation for the {season} season, {top_name} received the highest dynamic weighting ({top_wt}). "
            f"Expected operational range is {uncertainty_lower} to {uncertainty_upper} {unit}."
        )

        return WhyThisForecastResponse(
            location=location,
            forecast_valid_time=forecast_valid_time,
            lead_time_hours=lead_time_hours,
            season=season,
            weather_regime=weather_regime,
            regime_reasoning=regime_reasoning,
            variable=variable,
            blended_value=blended_value,
            unit=unit,
            uncertainty_range={"lower": uncertainty_lower, "upper": uncertainty_upper},
            model_disagreement=disagreement_spread,
            confidence_assessment=confidence_assessment,
            model_breakdown=model_details,
            historical_validation=historical_validation_records,
            data_sources=data_sources,
            explanation_summary=summary
        )
