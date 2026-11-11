package com.cardpay.gateway.sync.ui

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.cardpay.gateway.sync.R
import com.cardpay.gateway.sync.data.model.RecentTransaction
import com.cardpay.gateway.sync.databinding.ItemTransactionBinding
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class TransactionAdapter(
    private var items: List<RecentTransaction> = emptyList()
) : RecyclerView.Adapter<TransactionAdapter.ViewHolder>() {

    private val timeFormat = SimpleDateFormat("HH:mm • yyyy/MM/dd", Locale.getDefault())

    fun submitList(newList: List<RecentTransaction>) {
        items = newList
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemTransactionBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount(): Int = items.size

    inner class ViewHolder(private val binding: ItemTransactionBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(item: RecentTransaction) {
            binding.tvSender.text = item.sender.ifBlank { "بانک نامشخص" }

            val statusText = item.status
            if (item.statusCode == "MATCHED" || statusText.contains("تایید")) {
                binding.tvStatusBadge.setBackgroundResource(R.drawable.bg_badge_matched)
                binding.tvStatusBadge.setTextColor(Color.parseColor("#166534"))
                binding.tvStatusBadge.text = "تایید شده ✅"
                binding.tvBankSubtitle.text = "(سرخط تایید شده بانکی)"
            } else if (item.statusCode == "PENDING" || statusText.contains("بررسی")) {
                binding.tvStatusBadge.setBackgroundResource(R.drawable.bg_badge_pending)
                binding.tvStatusBadge.setTextColor(Color.parseColor("#B45309"))
                binding.tvStatusBadge.text = if (statusText.isNotBlank()) statusText else "در حال بررسی ⏳"
                binding.tvBankSubtitle.text = "(در حال بررسی به عنوان سرخط)"
            } else {
                binding.tvStatusBadge.setBackgroundResource(R.drawable.bg_badge_error)
                binding.tvStatusBadge.setTextColor(Color.parseColor("#991B1B"))
                binding.tvStatusBadge.text = if (statusText.isNotBlank()) statusText else "ناموفق ❌"
                binding.tvBankSubtitle.text = ""
            }

            if (item.amountToman != null && item.amountToman > 0) {
                val formattedAmount = NumberFormat.getNumberInstance(Locale.US).format(item.amountToman)
                binding.tvAmount.text = "مبلغ: $formattedAmount تومان"
                binding.tvAmount.visibility = View.VISIBLE
            } else {
                binding.tvAmount.visibility = View.GONE
            }

            if (!item.trackingCode.isNullOrBlank()) {
                binding.tvTrackingCode.text = "کد رهگیری: ${item.trackingCode}"
                binding.tvTrackingCode.visibility = View.VISIBLE
            } else {
                binding.tvTrackingCode.visibility = View.GONE
            }

            binding.tvSnippet.text = item.messageSnippet
            binding.tvTime.text = timeFormat.format(Date(item.timestamp))
        }
    }
}
