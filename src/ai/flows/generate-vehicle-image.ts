
'use server';
/**
 * @fileOverview An AI flow to generate an image of a vehicle based on its details.
 *
 * - generateVehicleImage - A function that handles the image generation process.
 * - GenerateVehicleImageInput - The input type for the generateVehicleImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateVehicleImageInputSchema = z.object({
  make: z.string().describe('The manufacturer of the vehicle.'),
  model: z.string().describe('The model of the vehicle.'),
  year: z.string().describe('The year of the vehicle.'),
  color: z.string().describe('The color of the vehicle.'),
});
export type GenerateVehicleImageInput = z.infer<typeof GenerateVehicleImageInputSchema>;

export async function generateVehicleImage(input: GenerateVehicleImageInput): Promise<string | null> {
  return generateVehicleImageFlow(input);
}

const generateVehicleImageFlow = ai.defineFlow(
  {
    name: 'generateVehicleImageFlow',
    inputSchema: GenerateVehicleImageInputSchema,
    outputSchema: z.string().nullable(),
  },
  async ({ make, model, year, color }) => {
    try {
        const { media } = await ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: `A high-quality, professional photograph of a ${color} ${year} ${make} ${model}. The car is clean and parked on a neutral, well-lit city street during the day. Front quarter view.`,
            config: {
              responseModalities: ['TEXT', 'IMAGE'],
            },
        });
        
        if (media?.url) {
            return media.url;
        }

        return null;

    } catch (error) {
        console.error("Error generating vehicle image:", error);
        return null;
    }
  }
);
