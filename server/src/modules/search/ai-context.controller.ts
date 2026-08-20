import { Request, Response, NextFunction } from 'express';
import { HybridSearchService, HybridSearchInput } from '../profiles/hybrid-search.service';
import { SemanticSearchService } from '../profiles/semantic-search.service';

const hybridSearchService = new HybridSearchService();
const semanticSearchService = new SemanticSearchService();

export async function getAiContext(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query.q as string;
    
    if (!query) {
      res.status(400).json({ success: false, message: 'Query (q) is required' });
      return;
    }

    const input: HybridSearchInput = {
      query,
      limit: 5 // Return top 5 for context
    };

    const result = await hybridSearchService.search(input);
    
    // Map to a lightweight format for the LLM to consume
    const contextProfiles = result.results.map(r => {
      const p = r.profile;
      return {
        id: p._id,
        name: p.displayName,
        type: p.type,
        rating: p.rating,
        experience: p.experience,
        subjects: p.teachingSlots?.map(s => s.subject || s.activity).filter(Boolean) || [],
        bio: p.bio,
        location: p.address?.town ? `${p.address.town}${p.address.district ? `, ${p.address.district}` : ''}` : undefined,
        fee: p.teachingSlots?.[0]?.feePerMonth,
      };
    });

    res.json({ success: true, context: contextProfiles });
  } catch (err: any) {
    if (err.name === 'LocationResolutionRequiredError' || err.name === 'LocationRequiredError') {
      try {
        const query = req.query.q as string;
        const fallbackResult = await semanticSearchService.search({ query, limit: 5 });
        const contextProfiles = fallbackResult.map(r => {
          const p = r.profile;
          return {
            id: p._id,
            name: p.displayName,
            type: p.type,
            rating: p.rating,
            experience: p.experience,
            subjects: p.teachingSlots?.map(s => s.subject || s.activity).filter(Boolean) || [],
            bio: p.bio,
            location: p.address?.town ? `${p.address.town}${p.address.district ? `, ${p.address.district}` : ''}` : undefined,
            fee: p.teachingSlots?.[0]?.feePerMonth,
          };
        });
        res.json({ success: true, context: contextProfiles });
        return;
      } catch (fallbackErr: any) {
        console.error('Fallback AI Context error:', fallbackErr);
      }
    }
    
    // If quota fails, return an empty context instead of breaking the chatbot
    console.error('AI Context error:', err);
    res.json({ success: false, context: [], error: err.message });
  }
}
