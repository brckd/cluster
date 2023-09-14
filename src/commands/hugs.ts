import { ApplyOptions } from "@sapphire/decorators";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { Hug } from "../schemata/Hugs";
import { EmbedBuilder } from "discord.js";

@ApplyOptions<Subcommand.Options>({
  name: "hugs",
  description: "Manage hugs",
  subcommands: [{ name: "give", chatInputRun: "chatInputGive" }],
})
export class UserCommand extends Subcommand {
  public override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder //
        .setName(this.name)
        .setDescription(this.description)
        .addSubcommand((command) =>
          command
            .setName("give")
            .setDescription("Give someone a hug")
            .addUserOption((option) =>
              option.setName("target").setDescription("Whom to hug").setRequired(true)
            )
        )
    );
  }

  public async chatInputGive(inter: Subcommand.ChatInputCommandInteraction) {
    const target = inter.options.getUser("target")!;

    const hug = await Hug.findOneAndUpdate(
      { guildId: inter.guildId, userId: target.id },
      {},
      { upsert: true, new: true }
    );
    hug.amount++;
    await hug.save();

    const embed = new EmbedBuilder().setDescription(`You have given ${inter.user} a hug!`);
    return inter.reply({ embeds: [embed] });
  }
}
